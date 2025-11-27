import { Link } from "react-router-dom";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.js";

function BuildPage() {
  return (
    <PageCenterContent>
      <h1>Sign up</h1>
      <hr/>
      <Link to="/login">Or log in</Link>
    </PageCenterContent>
  );
}

export default BuildPage;
