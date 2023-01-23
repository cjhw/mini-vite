import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// const App = () => <h1>hello 大帅B</h1>;

const container = document.getElementById("root");

createRoot(container as any).render(<App />);

// @ts-ignore
import.meta.hot.accept(() => {
  createRoot(container as any).render(<App />);
});
