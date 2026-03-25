import { useApi } from "../../foundation/useApiData.js";
import { tryFetchApi } from "../../foundation/api.js";
import { FlashcardTreeView } from "./view/treeView.jsx";
import "./style.css";

function BuildPage() {
    //Get URL param notebookId
    const urlParams = new URLSearchParams(window.location.search);
    const notebookId = urlParams.get("notebookId");
    if (!notebookId) {
        alert("Missing notebook id to show flashcard tree");
        window.location.href = "/";
        return <></>;
    }

    const { data, loading, error } = useApi(async () => {
        return await tryFetchApi("flashcards/get_selectable_pages_and_flashcards", {notebookId});
    });
    if (loading || error || !data) return <></>;
    return <FlashcardTreeView pageTree={data.pageTree} flashcards={data.flashcards}></FlashcardTreeView>;
}

export default BuildPage;
