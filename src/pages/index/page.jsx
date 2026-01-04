import { AppLineBreak } from "../../components/app/line_break/component.jsx";
import { PageViewComponent } from "../../components/app/page_view/component.jsx";
import { AppSideBar } from "../../components/app/sidebar-new/component.jsx";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import "./App.css";

import { withAuthCheck } from "../../foundation/authApi.js";
import { fetchApi } from "../../foundation/api.js";
import { useEffect, useState } from "react";

function BuildPage() {
  withAuthCheck();

  let [user, setUser] = useState(null);

  useEffect(() => {
    if (user) {
      return;
    }
    fetchApi("get_current_user_info")
      .then(setUser);
  });

  return (
    <div>
      <AppSideBar />
      <PageCenterContent>
        <h1>Pagepagepage <span color="grey">(hello user: {user?.label_name})</span></h1>
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
