import { Link } from "react-router-dom";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component";

function BuildPage() {
  return (
    <PageCenterContent>
      <h1>404 Unknown page</h1>
      <Link to="/">Take me home country road</Link>
    </PageCenterContent>
  );
}

export default BuildPage;
