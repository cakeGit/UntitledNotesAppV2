import { useRef } from "react";
import "./style.css";
import { AppSidebarLineBreak } from "./lineBreak/component.js";
import { AppSidebarNoteBookSelect } from "./noteBookSelect/component.js";

export function AppSideBar() {
    const sidebarRef = useRef(null);
    const sidebarTagRef = useRef(null);

    const startShowingAppSidebar = () => {
        sidebarTagRef.current.classList.add("show");
        sidebarRef.current.classList.add("show");
    };
    const stopShowingAppSidebar = () => {
        sidebarTagRef.current.classList.remove("show");
        sidebarRef.current.classList.remove("show");
    };

    return (
        <div>    
            <div ref={sidebarRef} className="app_sidebar">
                <div className="app_sidebar_logo"><b>open</b>book 📖</div>
                <AppSidebarLineBreak />
                <p>
                    Example list of app directory<br/>
                    Settings<br/>
                    Sign in/out<br/>
                    Account<br/>
                    These are all subject to change<br/>
                </p>
                <AppSidebarLineBreak />
                <AppSidebarNoteBookSelect currentName="📕 | My notebook" />
                <p>
                    TODO<br/>
                    Unit 1<br/>
                    → 1.1 Example subject<br/>
                    → 1.2 Example other<br/>
                    → 1.3 Example some more<br/>
                    → 1.4 More content in example<br/>
                    → 1.5 Example subject<br/>
                </p>
                <div ref={sidebarRef} className="app_sidebar_pull_tab">
                    <svg class="chevron" viewBox="0 0 10 10" width="10" height="10" xmlns="http://www.w3.org/2000/svg" style={{
                        position: "relative",
                        left: "1px",
                        color: "var(--color-text)",
                    }}>
                        <path d="M2 1 L6 5 L2 9" stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                </div>
            </div>
            <div 
                ref={sidebarTagRef}
                onMouseEnter={startShowingAppSidebar}
                className="app_sidebar_hover_tag">
            </div>
            <div className="app_sidebar_hover_out_box"
                onMouseLeave={stopShowingAppSidebar}/>
        </div>
    )
}