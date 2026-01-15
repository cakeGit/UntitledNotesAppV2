import { useEffect, useRef, useState } from "react";
import { ALL_FIELDS_PRESENT } from "../../../../../backend/web/foundation_safe/validations.js";
import { startDraggingPage } from "./pageDrag";

function NotebookHighlightTarget({ ref }) {
    return (
        <div
            style={{
                width: "100%",
                height: "0",
                position: "relative",
            }}
        >
            <div
                ref={ref}
                style={{
                    //TODO: make this a stylesheet thing
                    height: "3px",
                    width: "100%",
                    opacity: 0,
                    backgroundColor: "blue",
                    borderRadius: "2px",
                }}
            ></div>
        </div>
    );
}

function NotebookStructureNode({
    parentId,
    item,
    index,
    level,
    notebookId,
    structurePlaceTargets,
    currentDragInfoRef,
    socketRef,
    sendPageMove,
    first,
    setSidebarLock,
}) {
    const pageRef = useRef();
    const abovePlaceTargetRef = useRef();
    const belowPlaceTargetRef = useRef();
    const belowIndentedPlaceTargetRef = useRef();

    structurePlaceTargets.push({
        refs: [
            { ref: abovePlaceTargetRef, index: index },
            { ref: belowPlaceTargetRef, index: index + 1 },
            { ref: belowIndentedPlaceTargetRef, index: 0, inside: true },
        ],
        pageId: item.pageId,
        parentId: parentId,
    });

    return (
        <div>
            {first ? (
                <NotebookHighlightTarget ref={abovePlaceTargetRef} />
            ) : null}

            <div ref={pageRef}>
                <a href={`/?notebook_id=${notebookId}&page_id=${item.pageId}`}>
                    {item.name || "(untitled)"}
                </a>

                <button
                    onClick={() =>
                        startDraggingPage(
                            currentDragInfoRef,
                            structurePlaceTargets,
                            item.pageId,
                            pageRef,
                            socketRef,
                            sendPageMove,
                            setSidebarLock
                        )
                    }
                >
                    #
                </button>

                <div style={{ marginLeft: "20px", marginBottom: "2px", borderLeft: `2px solid rgba(0, 0, 0, ${0.5 / (3 + level)})`, paddingLeft: "5px" }}>
                    {item.children && item.children.length > 0 ? (
                        <NotebookStructureLevel
                            structure={item.children}
                            parentId={item.pageId}
                            level={level + 1}
                            notebookId={notebookId}
                            structurePlaceTargets={structurePlaceTargets}
                            currentDragInfoRef={currentDragInfoRef}
                            socketRef={socketRef}
                            sendPageMove={sendPageMove}
                            setSidebarLock={setSidebarLock}
                        />
                    ) : (
                        <NotebookHighlightTarget
                            ref={belowIndentedPlaceTargetRef}
                        />
                    )}
                </div>

                <NotebookHighlightTarget ref={belowPlaceTargetRef} />
            </div>
        </div>
    );
}

function NotebookStructureLevel({
    structure,
    parentId = null,
    level = 0,
    notebookId,
    structurePlaceTargets = [],
    currentDragInfoRef,
    socketRef,
    sendPageMove,
    setSidebarLock,
}) {
    let first = true;
    return (
        <div>
            {structure ? (
                structure.map((item, index) => {
                    let component = (
                        <NotebookStructureNode
                            parentId={parentId}
                            key={index}
                            item={item}
                            index={index}
                            level={level}
                            notebookId={notebookId}
                            structurePlaceTargets={structurePlaceTargets}
                            currentDragInfoRef={currentDragInfoRef}
                            socketRef={socketRef}
                            sendPageMove={sendPageMove}
                            first={first}
                            setSidebarLock={setSidebarLock}
                        />
                    );
                    first = false;
                    return component;
                })
            ) : (
                <div>Loading notebook...</div>
            )}
        </div>
    );
}

function handleStructureEditorMessage(message, updateStructure) {
    switch (message.type) {
        case "notebook_structure":
            const structure = message.structure;
            ALL_FIELDS_PRESENT.test({ structure }).throwErrorIfInvalid();
            //Render the notebook structure in the UI
            console.log("Received notebook structure:", structure);
            updateStructure({ children: [] });
            updateStructure(structure);
            break;
        default:
            console.warn(
                "Unknown message type from structure editor:",
                message.type
            );
    }
}

export function NotebookStructureView({ notebookId, setSidebarLock }) {
    let [notebookStructure, setNotebookStructure] = useState(null);
    let [rerenderKey, setRerenderKey] = useState(0);
    let currentDragInfoRef = useRef(null);
    let socketRef = useRef(null);

    const structurePlaceTargets = [];

    const requestNewPage = useRef(() => {});
    const sendPageMove = useRef(() => {});

    //Open a websocket connection to the structure editor for this notebook
    useEffect(() => {
        const ws = new WebSocket(
            `ws://${window.location.host}/structure_editor?notebookId=${notebookId}`
        );

        ws.onopen = () => {
            console.log("Connected to notebook structure editor WebSocket");
            requestNewPage.current = () => {
                console.log("Requesting new page");
                ws.send(
                    JSON.stringify({
                        type: "request_new_page", //Kinda debug rn, since there is no information about where we want the page or what name
                    })
                );
            };
            sendPageMove.current = (pageId, newParentId, newIndex) => {
                console.log(
                    "Sending page move:",
                    pageId,
                    newParentId,
                    newIndex
                );
                ws.send(
                    JSON.stringify({
                        type: "move_page",
                        pageId,
                        newParentId,
                        newIndex,
                    })
                );
            };
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);
            try {
                handleStructureEditorMessage(message, (struct) => {
                    setNotebookStructure(struct);
                    setRerenderKey((key) => key + 1);
                });
            } catch (error) {
                console.error(
                    "Error handling message from structure editor:",
                    error
                );
            }
        };

        return () => {
            ws.close();
        };
    }, [notebookId]);

    return (
        <>
            <button onClick={() => requestNewPage.current()}>New Page</button>
            <NotebookStructureLevel
                key={rerenderKey}
                structure={notebookStructure?.children}
                notebookId={notebookId}
                structurePlaceTargets={structurePlaceTargets}
                currentDragInfoRef={currentDragInfoRef}
                socketRef={socketRef}
                sendPageMove={sendPageMove}
                setSidebarLock={setSidebarLock}
            />
        </>
    );
}
