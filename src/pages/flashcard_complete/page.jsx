import { AppLineBreak } from "../../components/app/line_break/component.jsx";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import "./style.css";

function BuildPage() {
    return (
        <PageCenterContent>
            <h1>Flashcard session complete!</h1>
            <AppLineBreak />
            <p>You have completed your flashcard session. Well done!</p>
            <br />
            <a href="/flashcard_session">Do the session again</a>
            <br />
            <a href="/flashcard_select">Setup a new session</a>
            <br />
            <a href="/">Return to your notes</a>
        </PageCenterContent>
    );
}

export default BuildPage;
