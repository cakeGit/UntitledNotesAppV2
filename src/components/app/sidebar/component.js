import { useRef } from "react";
import "./style.css";

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
                hello hello
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