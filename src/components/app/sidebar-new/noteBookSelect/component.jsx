import "./style.css";

export function AppSidebarNoteBookSelect({currentName}) {
    return (
        <div className="app_sidebar_notebook_select" style={{cursor: "pointer"}}>
            {currentName}
        </div>
    );
}