import { useApi } from "../../foundation/useApiData.js";
import { tryFetchApi } from "../../foundation/api.js";
import { FlashcardTreeView } from "./view/treeView.jsx";
import "./style.css";

function BuildPage() {
    const { data, loading, error } = useApi(async () => {
        return await tryFetchApi("flashcards/get_selectable_pages_and_flashcards", {notebookId: "3ff004a2-3fd3-4b95-b982-4058c3a1a9e2"});
    });
    if (loading || error || !data) return <></>;
    return <FlashcardTreeView pageTree={data.pageTree} flashcards={data.flashcards}></FlashcardTreeView>;
}

export default BuildPage;
