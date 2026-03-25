import { useEffect, useRef, useState } from "react";
import { ALL_FIELDS_PRESENT } from "../../../../../backend/web/foundation_safe/validations.js";
import { startDraggingPage } from "./pageDrag";
import "./style.css";
import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useModal } from "../../../../foundation/modals/genericModal.jsx";
import { DeletePageModal } from "./modals/deleteModal.jsx";

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
                    backgroundColor: "var(--color-accent)",
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
    sendDeletePage,
    first,
    setSidebarLock,
    currentPageId,
    optionsOpenPageId,
    setOptionsOpenPageId,
    modalHook
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

    const optionsOpen = optionsOpenPageId === item.pageId;

    return (
        <div>
            {first ? (
                <NotebookHighlightTarget ref={abovePlaceTargetRef} />
            ) : null}

            <div ref={pageRef}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Link
                        to={`/?notebook_id=${notebookId}&page_id=${item.pageId}`}
                        className="notebook_structure_page_name"
                        style={{
                            fontWeight:
                                item.pageId === currentPageId ? "700" : "500",
                            textDecoration:
                                item.pageId === currentPageId
                                    ? "underline"
                                    : "none",
                        }}
                    >
                        {item.name || "(untitled)"}
                    </Link>

                    <div>
                        {optionsOpen && (
                            <div className="page_block_options">
                                <div className="page_block_options_container">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            modalHook.openModal(
                                                new DeletePageModal(
                                                    () => sendDeletePage.current(item.pageId),
                                                    item.name,
                                                    modalHook
                                                )
                                            );
                                        }}
                                        className="page_block_binner"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            style={{ display: "block" }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (e.button === 0) {
                                    startDraggingPage(
                                        currentDragInfoRef,
                                        structurePlaceTargets,
                                        item.pageId,
                                        pageRef,
                                        socketRef,
                                        sendPageMove,
                                        setSidebarLock,
                                    );
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setOptionsOpenPageId(item.pageId);
                            }}
                            className={`page_structure_drag_button ${optionsOpenPageId === item.pageId ? "page_structure_drag_button_open" : ""}`}
                        >
                            <BsThreeDotsVertical />
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        marginLeft: "10px",
                        marginBottom: "1px",
                        marginTop: "1px",
                        borderLeft: `3px solid rgba(0.25, 0.25, 0.25, ${
                            1 / (3 + level)
                        })`,
                        paddingLeft: "10px",
                    }}
                >
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
                            sendDeletePage={sendDeletePage}
                            setSidebarLock={setSidebarLock}
                            currentPageId={currentPageId}
                            optionsOpenPageId={optionsOpenPageId}
                            setOptionsOpenPageId={setOptionsOpenPageId}
                            modalHook={modalHook}
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
    sendDeletePage,
    setSidebarLock,
    currentPageId,
    optionsOpenPageId,
    setOptionsOpenPageId,
    modalHook
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
                            sendDeletePage={sendDeletePage}
                            first={first}
                            setSidebarLock={setSidebarLock}
                            currentPageId={currentPageId}
                            optionsOpenPageId={optionsOpenPageId}
                            setOptionsOpenPageId={setOptionsOpenPageId}
                            modalHook={modalHook}
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
            updateStructure(structure);
            break;
        default:
            console.warn(
                "Unknown message type from structure editor:",
                message.type,
            );
    }
}

export function NotebookStructureView({ notebookId, setSidebarLock }) {
    let [notebookStructure, setNotebookStructure] = useState(null);
    let [rerenderKey, setRerenderKey] = useState(0);
    let [optionsOpenPageId, setInnerOptionsOpenPageId] = useState(null);
    const modalHook = useModal();

    let currentDragInfoRef = useRef(null);
    let socketRef = useRef(null);

    const structurePlaceTargets = [];

    const requestNewPage = useRef(() => {});
    const sendPageMove = useRef(() => {});
    const sendDeletePage = useRef(() => {});

    const handleClickOutside = (event) => {
        if (!event.target.closest(".page_block_options")) {
            setInnerOptionsOpenPageId(null);
            setSidebarLock(false);
            document.removeEventListener("mousedown", handleClickOutside);
        }
    };

    function setOptionsOpenPageId(pageId) {
        setInnerOptionsOpenPageId(pageId);
        if (pageId) {
            //If opening to a page, lock sidebar and close on click outside. If closing, remove click listener and unlock sidebar
            setSidebarLock(true);
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            setSidebarLock(false);
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }

    //Open a websocket connection to the structure editor for this notebook
    useEffect(() => {
        const ws = new WebSocket(
            `ws://${window.location.host}/structure_editor?notebookId=${notebookId}`,
        );

        ws.onopen = () => {
            requestNewPage.current = () => {
                ws.send(
                    JSON.stringify({
                        type: "request_new_page", //Ideally we would allow a user to immediatley submit a name but this is fine for now
                    }),
                );
            };
            sendPageMove.current = (pageId, newParentId, newIndex) => {
                ws.send(
                    JSON.stringify({
                        type: "move_page",
                        pageId,
                        newParentId,
                        newIndex,
                    }),
                );
            };
            sendDeletePage.current = (pageId) => {
                ws.send(
                    JSON.stringify({
                        type: "delete_page",
                        pageId,
                    }),
                );
            }
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            try {
                handleStructureEditorMessage(message, (struct) => {
                    setNotebookStructure(struct);
                    setRerenderKey((key) => key + 1);
                });
            } catch (error) {
                console.error(
                    "Error handling message from structure editor:",
                    error,
                );
            }
        };

        return () => {
            ws.close();
        };
    }, [notebookId]);

    const currentPageId = new URLSearchParams(window.location.search).get(
        "page_id",
    );

    return (
        <>
            <NotebookStructureLevel
                key={rerenderKey}
                structure={notebookStructure?.children}
                notebookId={notebookId}
                structurePlaceTargets={structurePlaceTargets}
                currentDragInfoRef={currentDragInfoRef}
                socketRef={socketRef}
                sendPageMove={sendPageMove}
                sendDeletePage={sendDeletePage}
                setSidebarLock={setSidebarLock}
                currentPageId={currentPageId}
                optionsOpenPageId={optionsOpenPageId}
                setOptionsOpenPageId={setOptionsOpenPageId}
                modalHook={modalHook}
            />

            <div className="page_structure_new_page_container">
                <button
                    onClick={() => requestNewPage.current()}
                    className="page_structure_new_page_button"
                >
                    +
                </button>
            </div>
            {modalHook.render()}
        </>
    );
}
