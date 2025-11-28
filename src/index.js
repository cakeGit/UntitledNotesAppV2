import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals.js";
import { BrowserRouter } from "react-router-dom";
import Main from "./Main.js";
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="72817083579-kd1gu053ehj8os6snedmut08i4dgl6md.apps.googleusercontent.com">
      <BrowserRouter>
        <Main />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

reportWebVitals();
