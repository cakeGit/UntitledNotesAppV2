import { useRef, useState } from "react";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import { fetchApi } from "../../foundation/api.js";
import { useApi } from "../../foundation/useApiData.js";
import "./style.css";
import { AppLineBreak } from "../../components/app/line_break/component.jsx";

function collectPageIdsRecursively(pages) {
    let ids = [];
    for (const page of pages) {
        ids.push(page.pageId);
        if (page.children && page.children.length > 0) {
            ids = ids.concat(collectPageIdsRecursively(page.children));
        }
    }
    return ids;
}

function createBulkSelectionControl(
    pages,
    parentId,
    selectedPageIdsRef,
    updateRender,
) {
    const allPageIds = collectPageIdsRecursively(pages);
    allPageIds.push(parentId);
    const allSelected = allPageIds.every((id) =>
        selectedPageIdsRef.current.has(id),
    );
    const performAction = () => {
        if (allSelected) {
            //Deselect all
            for (const id of allPageIds) {
                selectedPageIdsRef.current.delete(id);
            }
        } else {
            //Select all
            for (const id of allPageIds) {
                selectedPageIdsRef.current.add(id);
            }
        }
        updateRender((r) => r + 1); //Force rerender, but TODO: restructure to have a ref to avoid this
    };
    return (
        <button onClick={performAction}>
            {allSelected ? "Exclude All" : "Include All"}
        </button>
    );
}

function FlashcardPageSelectionLevel({
    pages,
    selectedPageIdsRef,
    pageSelectionRef,
    updateRender,
}) {
    return (
        <div ref={pageSelectionRef} className="flashcard_page_selection_level">
            {pages.map((page) => {
                const hasChildren = page.children && page.children.length > 0;
                return (
                    <div
                        key={page.pageId}
                        className="flashcard_page_selection_item"
                    >
                        <input
                            type="checkbox"
                            checked={selectedPageIdsRef.current.has(
                                page.pageId,
                            )}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    selectedPageIdsRef.current.add(page.pageId);
                                } else {
                                    selectedPageIdsRef.current.delete(
                                        page.pageId,
                                    );
                                }
                                updateRender((r) => r + 1); //Force rerender, but TODO: restructure to have a ref to avoid this
                            }}
                        />
                        &nbsp;
                        {page.name}&nbsp;
                        {hasChildren
                            ? createBulkSelectionControl(
                                  page.children,
                                  page.pageId,
                                  selectedPageIdsRef,
                                  updateRender,
                              )
                            : null}
                        {hasChildren ? (
                            <div style={{ marginLeft: "20px" }}>
                                <FlashcardPageSelectionLevel
                                    pages={page.children}
                                    selectedPageIdsRef={selectedPageIdsRef}
                                    pageSelectionRef={pageSelectionRef}
                                    updateRender={updateRender}
                                />
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function BuildPage() {
    const pageSelectionRef = useRef(null);
    const [_, updateRender] = useState(0);
    const selectedPageIdsRef = useRef(new Set()); //A faster version of a list, since we dont need order
    const sessionOptionRef = useRef(null);

    const { data, loading, error } = useApi(async () => {
        return await fetchApi("flashcards/get_selectable_pages", {
            notebookId: null,
        });
    });
    if (loading || error) return <></>;

    const startFlashcardSession = () => {
        //Load selected ids into the session storage and send the user to the flashcard session page
        const selectedPageIds = Array.from(selectedPageIdsRef.current);
        sessionStorage.setItem(
            "flashcard_session_selected_page_ids",
            JSON.stringify(selectedPageIds),
        );
        sessionStorage.setItem(
            "flashcard_session_option",
            sessionOptionRef.current.value,
        );
        window.location.href = "/flashcard_session";
    };

    return (
        <PageCenterContent>
            <h1>Start flashcard revision session</h1>
            <AppLineBreak />
            <br />
            <h2>Select pages to revise from</h2>
            <AppLineBreak />
            <br />
            <FlashcardPageSelectionLevel
                pages={data.children}
                selectedPageIdsRef={selectedPageIdsRef}
                pageSelectionRef={pageSelectionRef}
                updateRender={updateRender}
            />
            <br />
            <h2>Session options</h2>
            <AppLineBreak />
            <br />
            <select ref={sessionOptionRef}>
                <option value="self_assess">
                    Self-assess (show answer, then rate difficulty)
                </option>
                <option value="multi_choice">
                    Multiple choice (Pick out of 4)
                </option>
            </select>
            <br />
            <br />
            <AppLineBreak />
            <br />
            <button onClick={startFlashcardSession}>Go!</button>
        </PageCenterContent>
    );
}

export default BuildPage;
