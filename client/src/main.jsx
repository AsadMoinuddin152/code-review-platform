// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { ConfigProvider } from "antd";
import { client } from "./apollo/client";
import App from "./App";
import "./index.css";

// 1) On load, check for `?token=…` and store in localStorage
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
if (token) {
  localStorage.setItem("code-review-platform", token);
  // clean up the URL so you don’t keep seeing `?token=…`
  window.history.replaceState({}, document.title, window.location.pathname);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </ApolloProvider>
);
