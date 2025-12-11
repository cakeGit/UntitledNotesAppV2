import { Route, Routes } from "react-router-dom";

import Home from "./pages/index/page.jsx";
import Error404 from "./pages/error404/page.jsx";
import GetAccount from "./pages/get_account/page.jsx";
import CreateAccount from "./pages/create_account/page.jsx";

const Main = () => {
  return (
    <Routes>
      <Route index element={<Home/>}></Route>
      <Route path="/get_account" element={<GetAccount/>}></Route>
      <Route path="/create_account" element={<CreateAccount/>}></Route>
      <Route path="*" element={<Error404/>}></Route>
    </Routes>
  );
}

export default Main;