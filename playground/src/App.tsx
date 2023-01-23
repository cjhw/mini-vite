import { useState } from "react";
import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(55556);
  return (
    <div>
      <div>{count}</div>
      {/* <img src={logo} alt="" /> */}
      <button
        onClick={() => {
          setCount((num: number) => num + 1);
        }}
      >
        +1
      </button>
    </div>
  );
}

export default App;
