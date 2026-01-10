import { AppLineBreak } from "../../components/app/line_break/component.jsx";
import { PageViewComponent } from "../../components/app/page_view/component.jsx";
import { AppSideBar } from "../../components/app/sidebar-new/component.jsx";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import "./App.css";

import { withAuthCheck } from "../../foundation/authApi.js";
import { fetchApi, fetchApiCached } from "../../foundation/api.js";
import { useEffect, useState } from "react";

function BuildPage() {
    withAuthCheck();

    let [user, setUser] = useState(null);

    // const [currentNotebookId, setNotebook] = useState(
    //     localStorage.getItem("currentNotebookId") || null
    // );
    // const [currentNotebookName, setNotebookName] = useState(
    //     localStorage.getItem("currentNotebookName") || null
    // );

    // const [currentPageId, setPageId] = useState(
    //     localStorage.getItem("currentPageId") || null
    // );

    if (!user) {
        fetchApi("get_current_user_info")
            .then((data) => {
                setUser(data);
            })
            .catch((error) => {
                console.error("Failed to get current user:", error);
            });
        return <></>;
    }

    //Read query params for notebook_id and page_id
    const urlParams = new URLSearchParams(window.location.search);
    const currentNotebookId = urlParams.get("notebook_id");
    const currentPageId = urlParams.get("page_id");

    if (!currentNotebookId) {
        fetchApi("notebook/get_default_notebook")
            .then((data) => {
                // localStorage.setItem("currentNotebookId", data.notebook_id);
                // localStorage.setItem("currentNotebookName", data.name);
                window.location.href = "/?notebook_id=" + data.notebook_id;
                // setNotebook(data.notebook_id);
                // setNotebookName(data.name);
            })
            .catch((error) => {
                console.error("Failed to get default notebook:", error);
            });
        return <></>;
    } else {
        fetchApi("notebook/check_notebook_access", {
            notebook_id: currentNotebookId,
        }).catch((error) => {
            console.error("No access to notebook:", error);
            // localStorage.removeItem("currentNotebookId");
            // localStorage.removeItem("currentNotebookName");
            // setNotebook(null);
            // setNotebookName(null);
        });
    }

    if (!currentPageId) {
        fetchApi("notebook/get_default_page", {
            notebook_id: currentNotebookId,
        })
            .then((data) => {
                // localStorage.setItem("currentPageId", data.page_id);
                window.location.href =
                    "/?notebook_id=" +
                    currentNotebookId +
                    "&page_id=" +
                    data.page_id;
                setPageId(data.page_id);
            })
            .catch((error) => {
                console.error("Failed to get default page:", error);
            });
        return <></>;
    }

    return (
        <div>
            <AppSideBar
                currentNotebookId={currentNotebookId}
            />
            <PageCenterContent>
                <h1>
                    Pagepagepage{" "}
                    <span color="grey">(hello user: {user?.label_name})</span>
                </h1>
                <AppLineBreak />

                {currentPageId ? (
                    <PageViewComponent
                        pageId={currentPageId}
                    ></PageViewComponent>
                ) : (
                    <div>Loading page...</div>
                )}
            </PageCenterContent>
            {/* <CenterColumn>
        <h1>UntitledNotesApp</h1>
        {/* <PageViewComponent pageUuid=""></PageViewComponent> }
      </CenterColumn> */}
        </div>
    );
}

export default BuildPage;
