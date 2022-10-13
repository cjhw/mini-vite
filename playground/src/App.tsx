import { useState } from "react";
import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(1234);
  return <div>{count}</div>;
}

export default App;
