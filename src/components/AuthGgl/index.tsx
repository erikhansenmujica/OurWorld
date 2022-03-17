import React from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCookies } from "react-cookie";

export default function () {
  const [cookies, setCookie, removeCookie] = useCookies(["token"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const param = searchParams.get("authorization");
  axios
    .get("https://api.ourworldmeta.com/account/me", {
      headers: {
        Authorization: param || "",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
    .then((res) => {
      if (res.data.email) {
        var date = new Date();
        date.setDate(date.getDate() + 1);
        setCookie("token", param, { path: "/", expires: date });
        navigate("/");
      }
    })
    .catch(() => {
      navigate("/login?error=true");
    });
  return <h1>loading...</h1>;
}
