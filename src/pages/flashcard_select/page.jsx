import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import "./style.css";

function BuildPage() {
    const pageSelectionRef = useRef(null);

    return (
        <PageCenterContent>
            <h1>Start flashcard revision session</h1>
            <hr/>
            <h4>Select pages to revise from</h4>
            <div ref={pageSelectionRef}></div>
            <hr/>
            <button>Go!</button>
        </PageCenterContent>
    );
}

export default BuildPage;
