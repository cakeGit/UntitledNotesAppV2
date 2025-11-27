import { Link } from "react-router-dom";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.js";

function BuildPage() {
  return (
    <PageCenterContent>
      <h1>404 Unknown page</h1>
      <Link to="/">Take me home</Link>
    </PageCenterContent>
  );
}

export default BuildPage;
