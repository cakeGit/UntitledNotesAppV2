import { AppLineBreak } from "../../components/app/line_break/component";
import { PageViewComponent } from "../../components/app/page_view/component";
import { AppSideBar } from "../../components/app/sidebar-new/component";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component";
import "./App.css";

function BuildPage() {
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
