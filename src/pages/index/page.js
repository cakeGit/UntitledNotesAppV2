import { AppLineBreak } from "../../components/app/line_break/component.js";
import { PageViewComponent } from "../../components/app/page_view/component.js";
import { AppSideBar } from "../../components/app/sidebar-new/component.js";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.js";
import "./App.css";

import { withAuthCheck, authElements } from "../../foundation/authApi.js";

function BuildPage() {
  withAuthCheck();
  return (
    <div>
      {authElements()}
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
