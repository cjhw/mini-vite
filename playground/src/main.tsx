import React from "react";
import ReactDOM from "react-dom";
// import App from "./App";
import "./index.css";

const App = () => <h1>hello 大帅B</h1>;

ReactDOM.render(<App />, document.getElementById("root"));

// @ts-ignore
import.meta.hot.accept(() => {
  ReactDOM.render(<App />, document.getElementById("root"));
});
