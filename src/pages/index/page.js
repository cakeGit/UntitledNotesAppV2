import { PageViewComponent } from "../../components/app/pageview/component";
import { AppSideBar } from "../../components/app/sidebar-new/component";
import { CenterColumn } from "../../components/layout/centerColumn/component";
import "./App.css";

function BuildPage() {
  return (
    <div>
      <AppSideBar />
      {/* <CenterColumn>
        <h1>UntitledNotesApp</h1>
        {/* <PageViewComponent pageUuid=""></PageViewComponent> }
      </CenterColumn> */}
    </div>
  );
}

export default BuildPage;
