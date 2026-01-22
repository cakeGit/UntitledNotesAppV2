import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import "./drawingCanvas.css";
import { useEffect, useRef, useState } from "react";
import jsonpack from "jsonpack";

//Little utility, to ensure the function is not called more often than the wait time, and will always ensure the last call is executed,
// even though it may be delayed.
class Debouncer {
    constructor(debouncedFunction, wait) {
        this.debouncedFunction = debouncedFunction;
        this.wait = wait;

        this.timeout = null;
        this.lastCallTime = 0;
    }

    invoke() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;

        if (timeSinceLastCall >= this.wait) {
            this.lastCallTime = now;
            this.debouncedFunction(...arguments);
        } else {
            this.timeout = setTimeout(
                () => {
                    this.debouncedFunction(...arguments);
                    this.timeout = null;
                },
                Math.max(this.wait - timeSinceLastCall, 0),
            );
        }
    }

    cancel() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

async function compress(data) {
    if (!data) return null;

    //This is silly, but is optimised by the interpreter
    data = JSON.parse(JSON.stringify(data));

    //Start with jsonpack, then use gzip to further compress to a uint8array
    const jsonPack = jsonpack.pack(data);
    const compressedStream = new Blob([jsonPack])
        .stream()
        .pipeThrough(new CompressionStream("gzip"));
    const response = await new Response(compressedStream).bytes();
    return response.toBase64();
}

async function uncompress(compressedData) {
    if (!compressedData) return null;
    const uintData = Uint8Array.fromBase64(compressedData);
    //Reverse of compress
    const decompressedStream = new Blob([uintData])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
    const response = await new Response(decompressedStream).text();
    const unpacked = jsonpack.unpack(response);
    return unpacked;
}

export function PageDrawingCanvasBlock({
    blockId,
    data,
    pageRef,
    children,
    ref,
}) {
    const [editor, setEditor] = useState(null);
    const lastSnapshot = useRef(null);
    const lastCompressedSnapshot = useRef(null);
    const suppressNextUpdate = useRef(false);

    useEffect(() => {
        if (!editor) return;
        //JS asynchronous shenanagains, useEffect cant be async, however,
        // this script needs to be, so we create a new function and run it in the background
        (async () => {
            if (data.documentData) {
                //Check the data because if we compress it takes too long and it may have changed
                if (lastCompressedSnapshot.current === data.documentData) {
                    return; //Already loaded this one (we triggered our own change)
                }
                const document = await uncompress(data.documentData);
                lastSnapshot.current = document;
                
                //Load snapshot triggers a store update, so we use this marker to denote we drop the next update
                suppressNextUpdate.current = true;
                editor.loadSnapshot({ document });
            }
        })();
    }, [data.documentData, editor]);

    useEffect(() => {
        if (!editor) return;

        const debouncedSave = new Debouncer(async (entry) => {
            const snapshot = editor.getSnapshot();

            lastSnapshot.current = snapshot.document;
            const compressed = await compress(snapshot.document);
            if (lastCompressedSnapshot.current === compressed) {
                return; //No changes since last save, so we drop
            }
            lastCompressedSnapshot.current = compressed;
            //Pack because we're storing a fairly large JSON 'dump'
            pageRef.current.content[blockId].documentData = compressed;
            pageRef.current.sendChange(blockId);
        }, 100);

        const cleanup = editor.store.listen(
            (entry) => {
                if (!suppressNextUpdate.current) {
                    debouncedSave.invoke(entry);
                } else {
                    suppressNextUpdate.current = false;
                }
            },
            {
                scope: "document",
            },
        );

        return () => {
            cleanup();
            debouncedSave.cancel();
        };
    }, [editor]);

    return (
        <div style={{ width: "100%", height: "500px" }}>
            <Tldraw
                //Because we are simply networking the whole canvas, images would require full tldraw networking integration.
                // this means we disable image and video assets for now, they are allowed in the rest of the page anyways.
                acceptedImageMimeTypes={[]}
                acceptedVideoMimeTypes={[]}
                maxAssetSize={0}
                options={{
                    maxPages: 1,
                }}
                onMount={setEditor}
            />{" "}
        </div>
    );
}
