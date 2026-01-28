import { useEffect, useRef, useState } from "react";
import "./flashcard.css";
import { compress, uncompress } from "../../../../foundation/jsonCompression";
import { Box, Tldraw, TldrawEditor, TldrawImage } from "tldraw";
import { createPortal } from "react-dom";
import { useCanvasEditorHelper } from "../../foundation/useCanvasEditorHelper";
import { MdDraw, MdTextFields } from "react-icons/md";
import Select from "react-select";

const BLANK_CANVAS_SNAPSHOT =
    "H4sIAAAAAAAACm2S227aQBRFf8ZvVRGHO3kj9yshISEXyUSDPTWj4DEdD21arY+vMDSC2C8zR2uP9t46mtxnThNn0SrV1h/8H0icicfmr8aqVJNqrzAx/s9SD9fg891SJfpgfTBSif4mGBvrD5QUCnk016naXhPtcpNZcv1zpW2kc6IsrflF7NTvWl4U2QEqz7XfBZFKtVO75LPFDjM298pGuoq9rTu95V75PbloWvnc6Vx/8Vpmxnrt9qrP1bJcvTbLsvdUufeyYtIviRv8y8Q6KxnXEpetlmXs9Ycv06rQjbIeK8yrEm22v6ANXRhbQX+49X8oYeVcVhE3N8l8YZJ5RXOdznRcxqVdbXBpVzNjY2OTTfB0QIM2gtBgVEwdhFZB29Rp0qDBgH6hdQutTQuZToM6gRA0kC5NvrdoEYRbi25Ij2ALejTpM+CQDkdhyDHBCdLjlOAM6XOODLhADrlEjrhCjrlGTrhBThkiZ9wi54yQC+6QS+6RK8bINQ/IDY/IkAlyyxMy4hm54wW55xUZI3XkARHkEWkgE6SJPCEt5BlpIy9IB3kNw/AfwADuW+YDAAA=";

function isBlankSnapshot(canvasData) {
    //For some reason, the tldraw image will completley fail if the canvas is empty,
    //To fix this, we check if the canvas data is blank (Missing any shape properties)
    const expectedKeys = ["document:document", "page:page"];
    for (const key in canvasData.store) {
        if (!expectedKeys.includes(key)) {
            return false; //Found a key that is not expected in a blank canvas
        }
    }
    return true;
}

// const BLANK_CANVAS_SNAPSHOT = "H4sIAAAAAAAACm2WW2/bOBCF/4zfFhI0vEnqUx3n7lycuxPALRSbTYTYlldSdtvi/PjFUN52KgdFZPbjcGZ4DimoaavaY1HN31d+3X76f4CXulzclD891sXKY+XbAuUC7Y+Nv2DwK25TvPhP/MCkePF/Ecr1wn9HQWEGzWux8Z8OzifTWzPelG+L/bkv3N8PiXnHd/xAXbVFW1ZrlM1ZNX/zC1SbYl62P0IpLOriX2zqatOg8S9csMG32ntsqpLHPzGvllWN52Uxf8O3crnEulp7LIrmFQ23v0LZjKrVZulbz8Nl1fgFymbi12jmxdJjU9R+3Z4sUBAlp3fLo65pNPNXvyq2P/e+brjNxv/97tdz32BereJ2yQ3GTdBQgKJpfCvBvFj5upDkl4CCleumLdZz/xH7ynJ+bdqi/WM6iPxheO0b38sVRPP1H62HrfZbj5+r6m1V1G+7M+WqV7HD/5QLX+0kjl/q6n2zi1v/vd2lHxXtZsIx2E3+UcV19adAHV2W6w/ot5qP8g4u6rr6oNxr+fK6LF9eP+jcr579YhfvaNXhHa2ey/WiXL90hb8MkYCQIIFBhhEiY0A3iKxBZLPtn4G6gXpAZB6gE0RmBGMQ6QQ8GiGiI0RkMII+gh5hDJ3hMvwbI4M6ghoh4hwZlIFKQA9dlTEixw0oWFD4nYSRA8EEapFAQ0FhiDzMpWHOwoC+WJfFzuR55pRLkyzPQMrGxiYJKZWkiSZlkcQWkY0dKHbcZ2wQKRNniHTGY6t5zsYKUUqxgkp4Luc45TiAiLFWjCmgbiGFH6NjBZPycrJp7GC7QMflbEhLLudxHsYpJ3ZdL2mXJ1OMOIXLwtqM202T2CDVITBjnnbJMk6WcqWwLsRm23XcXM71c9eBro4L2ydugLZ7MqwAadNtJEhgVLfbNOgRdpGFKBuShZ5pqxYrEml+Urd3xYspiNHpEqVhGHpOQi2ODlCFJyelIDZxvArpQ3EVsgRLiEI94m46H4hYF0pYBUqykIQfSUiauDCpg1IhPAl2KlYg5+RR2HlOXUTniU67o8Ep0s6+sOfgW0RbE9IuKuPkQdGI8jCjEv5fp5IK7VkTmy+DBAPCQIEeoREZGAxm2/OdzpBhsAUZNHIMsQeH0Qz7GBzAJDiEIRyBnnCMSOGEb852xT5OMcYZBuf4PDjFBS7xeXAARTiE4ltk1Cxk0ZzFCGA5QgvgGMiIlIEVIOMcuQBDBnsCjBjsC3DA4FCAIwbHApwwOP0NFPdhxiLijMG5ABcMLgWYMLgS4JrBjQC3vJdUgDuOuBdlw+YeRMSUwaOIyBk8/QaWnbEkgGKg+8D0gdBUsYTWiQhW3WYiYo+BUN3yEjXqb06orlh1JVS3IYdYotgGK5ZYXmLlkhAhjLJslBJAMbCnPfeVAHbMEWe9AyOBPeclwmzFZtsLATjCCrMtm22F2ZbNttJsPtr2VkSw2VaYbR8YTAV4ZCC8VXzGlCjr2GwnzHZspZqIJVc9kR3fOSfcd+HOXfeAE+6rmz5gb504uIr34rJ+DnE+1D2DYa9Tt9ffi+x0n8GByMECucOeYu5ILDlmcCLAKQNhpWMr3Xnf7GnvfCh5xZ5wyF8Wv3OwDVqqftm7hI6PgxPHwfFx0OLVFw6/E+fDsaZaXFPXfxm4IKF4GYSrrqWV094bRtveO8jxkXKi05RzpGIv2okX22w2wxWucYNb3GGMezxgiojwyK/8J35QAp3OQIQMQ5DiryM9m4EMBmT5W4scBpRC56AMegjKofdAQ/4Yoz3ofdAI+gC0D30IOuDvNDqEPgYdQZ+AjqFPQSfQY9Ap9BloDH0OOoO+AJ1DX4IuoCegS+gr0AT6GnQFfQO6hr7lrzl9B7qFvgfdQT+A7qGn/KGnH0FT6KfZbPYf8aVS6gAOAAA=";
function FlashcardSide({ side, data, pageRef, blockId }) {
    const textInputRef = useRef(null);
    const textDataKey = side + "Text";
    const canvasDataKey = side + "CanvasDocumentData";

    const isCanvas = data[canvasDataKey] != undefined;
    const [canvasData, setCanvasData] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const { setEditor } = useCanvasEditorHelper(
        blockId,
        canvasDataKey,
        data,
        pageRef,
        isCanvas && editModalOpen, //Added an additional optional argument to only enable when this is a canvas block
    );

    useEffect(() => {
        (async () => {
            if (isCanvas) {
                // const start = performance.now();
                const document = await uncompress(data[canvasDataKey]);
                // console.log("uncompressed canvas data for block ", blockId, "data", document, "in ", performance.now() - start, "ms");
                setCanvasData(document);
            }
        })();
    }, [data[canvasDataKey]]);

    const handleTextChanged = (e) => {
        if (textInputRef.current) {
            pageRef.current.content[blockId][textDataKey] =
                textInputRef.current.innerText;
            pageRef.current.sendChange(blockId);
            if (data[textDataKey]?.trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
        }
    };

    useEffect(() => {
        if (textInputRef.current) {
            textInputRef.current.innerText = data[textDataKey] || "";
            if (!data[textDataKey] || data[textDataKey].trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
        }
    }, [data[textDataKey]]);

    const enforceFlashcardStyle = async (e) => {
        const value = e.value;
        if (value === "canvas") {
            //"Switch" to canvas (define it as an empty canvas)
            pageRef.current.content[blockId][canvasDataKey] =
                BLANK_CANVAS_SNAPSHOT;
            const document = await uncompress(
                pageRef.current.content[blockId][canvasDataKey],
            );
            setCanvasData(document);
        } else {
            //"Switch" to text (clear non text data)
            delete pageRef.current.content[blockId][canvasDataKey];
            setCanvasData(null); //Reset canvas data state
        }
        pageRef.current.sendChange(blockId);
    };

    const selectOptions = [
        { value: "text", label: <MdTextFields /> },
        { value: "canvas", label: <MdDraw /> },
    ];

    return (
        <div className={"flashcard_side flashcard_side_" + side}>
            {isCanvas ? (
                <>
                    <div
                        className="flashcard_canvas"
                        onClick={() => setEditModalOpen(true)}
                    >
                        {canvasData ? (
                            isBlankSnapshot(canvasData) ? (
                                <div>Click to start drawing!</div>
                            ) : (
                                <TldrawImage
                                    snapshot={{ document: canvasData }}
                                />
                            )
                        ) : (
                            <></>
                        )}
                    </div>
                    {editModalOpen
                        ? createPortal(
                              <div className="flashcard_canvas_modal_blur">
                                  <div className="flashcard_canvas_modal_overlay">
                                      <div className="flashcard_canvas_modal_content">
                                          <button
                                              className="flashcard_canvas_modal_close_button"
                                              onClick={() =>
                                                  setEditModalOpen(false)
                                              }
                                          >
                                              X
                                          </button>
                                          <div className="flashcard_canvas_modal_canvas">
                                              <Tldraw
                                                  className="force_open_tlui"
                                                  acceptedImageMimeTypes={[]}
                                                  acceptedVideoMimeTypes={[]}
                                                  maxAssetSize={0}
                                                  options={{
                                                      maxPages: 1,
                                                  }}
                                                  onMount={setEditor}
                                              ></Tldraw>
                                          </div>
                                      </div>
                                  </div>
                              </div>,
                              document.body,
                          )
                        : null}
                </>
            ) : null}

            <div
                className="flashcard_text_box"
                contentEditable
                onInput={handleTextChanged}
                ref={textInputRef}
                placeholder={
                    side === "front"
                        ? "Front side text..."
                        : "Back side text..."
                }
            ></div>

            {/* <select
                className="flashcard_type_selector"
                onChange={enforceFlashcardStyle}
            >
                <option value="text" selected={!isCanvas}>
                    <MdDraw />
                </option>
                <option value="canvas" selected={isCanvas}>
                    Drawing
                </option>
            </select> */}

            <div className="flashcard_type_select_container">
                <Select
                    className="flashcard_type_select"
                    unstyled={true}
                    defaultValue={selectOptions[isCanvas ? 1 : 0]}
                    options={selectOptions}
                    isSearchable={false}
                    classNamePrefix={"select"}
                    onChange={enforceFlashcardStyle}
                />
            </div>
        </div>
    );
}

export function PageTextFlashcardBlock({
    blockId,
    data,
    pageRef,
    children,
    ref,
}) {
    return (
        <div ref={ref} className="flashcard_text">
            <FlashcardSide
                side="front"
                data={data}
                pageRef={pageRef}
                blockId={blockId}
            />
            <FlashcardSide
                side="back"
                data={data}
                pageRef={pageRef}
                blockId={blockId}
            />
        </div>
    );
}
