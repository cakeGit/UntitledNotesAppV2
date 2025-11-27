import { Route, Routes } from "react-router-dom";

import Home from "./pages/index/page.js";
import Error404 from "./pages/error404/page.js";
import Login from "./pages/login/page.js";
import Signup from "./pages/signup/page.js";

const Main = () => {
  return (
    <Routes>
      <Route index element={<Home/>}></Route>
      <Route path="*" element={<Error404/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/signup" element={<Signup/>}></Route>
    </Routes>
  );
}

export default Main;