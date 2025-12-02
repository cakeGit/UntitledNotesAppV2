import { Route, Routes } from "react-router-dom";

import Home from "./pages/index/page.js";
import Error404 from "./pages/error404/page.js";
import GetAccount from "./pages/get_account/page.js";
import CreateAccount from "./pages/get_account/page.js";

const Main = () => {
  return (
    <Routes>
      <Route index element={<Home/>}></Route>
      <Route path="*" element={<Error404/>}></Route>
      <Route path="/get_account" element={<GetAccount/>}></Route>
      <Route path="/create_account" element={<CreateAccount/>}></Route>
    </Routes>
  );
}

export default Main;