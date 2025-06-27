import { Route, Routes } from "react-router-dom";

import Home from "./pages/index/page";
import Error404 from "./pages/error404/page";

const Main = () => {
  return (
    <Routes>
      <Route index element={<Home/>}></Route>
      <Route path="*" element={<Error404/>}></Route>
    </Routes>
  );
}

export default Main;