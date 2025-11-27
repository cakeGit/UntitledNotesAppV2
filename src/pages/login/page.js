import { Link } from "react-router-dom";
import { PageCenterContent } from "../../components/layout/pageCenterContent/component.js";

function BuildPage() {
  return (
    <PageCenterContent>
      <h1>Log in</h1>
      <hr/>
      <Link to="/signup">Or sign up</Link>
      TODO: add actual login form here
    </PageCenterContent>
  );
}

export default BuildPage;
