import axios from "axios";
import React, { Fragment, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import AuthGgl from "./components/AuthGgl";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { World } from "./components/World";

export default function App() {
  const [cookies, setCookie, removeCookie] = useCookies(["token"]);
  const [route, setRoute] = useState<string>("/login");
  useEffect(() => {
    if (cookies.token) {
      // removeCookie("token");
    }
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        {/* <Route path="/signup" element={<Register />}></Route> */}
        <Route path="/loginCallback" element={<AuthGgl />}></Route>
        <Route path="/" element={<World />}></Route>
        <Route path="*" element={<Navigate to={route} />} />
      </Routes>
    </Router>
  );
}
