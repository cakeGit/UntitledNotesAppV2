import { AppLineBreak } from "../../components/app/line_break/component.jsx";
import { PageViewComponent } from "../../components/app/page_view/component.jsx";
import { AppSideBar } from "../../components/app/sidebar-new/component.jsx";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import "./App.css";

import { withAuthCheck } from "../../foundation/authApi.js";

function BuildPage() {
  withAuthCheck();
  return (
    <div>
      <AppSideBar />
      <PageCenterContent>
        <h1>Pagepagepage</h1>
        <AppLineBreak />
        <PageViewComponent pageId={0}></PageViewComponent>
      </PageCenterContent>
      {/* <CenterColumn>
        <h1>UntitledNotesApp</h1>
        {/* <PageViewComponent pageUuid=""></PageViewComponent> }
      </CenterColumn> */}
    </div>
  );
}

export default BuildPage;
