import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthGgl from "./components/AuthGgl";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { World } from "./components/World";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        {/* <Route path="/signup" element={<Register />}></Route> */}
        <Route path="/loginCallback" element={<AuthGgl />}></Route>
        <Route path="/" element={<World />}></Route>
        <Route path="*" element={<Navigate to={"/login"} />} />
      </Routes>
    </Router>
  );
}
