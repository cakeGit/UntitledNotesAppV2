import { AppLineBreak } from "../../components/app/lineBreak/component";
import { PageViewComponent } from "../../components/app/pageview/component";
import { AppSideBar } from "../../components/app/sidebar-new/component";
import { AppSidebarLineBreak } from "../../components/app/sidebar-new/lineBreak/component";
import { CenterColumn } from "../../components/layout/centerContent/component";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component";
import "./App.css";

function BuildPage() {
  return (
    <div>
      <AppSideBar />
      <PageCenterContent>
        <h1>Pagepagepage</h1>
        <AppLineBreak />
      </PageCenterContent>
      {/* <CenterColumn>
        <h1>UntitledNotesApp</h1>
        {/* <PageViewComponent pageUuid=""></PageViewComponent> }
      </CenterColumn> */}
    </div>
  );
}

export default BuildPage;
