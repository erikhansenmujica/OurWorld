import axios from "axios";
import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, Viewer } from "resium";
import { listenCookieChange } from "../../utils/cookieListener";
import styles from "./Login.module.css";
export const Login = (props: any) => {
  const router = useNavigate();
  const [cookies, setCookie, removeCookie] = useCookies(["token"]);
  const [form, setForm] = useState<{
    email: string;
    password: string;
  }>({
    email: "",
    password: "",
  });
  const [checked, setChecked] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("error");
  const checker = () => {
    return form.email && form.password;
  };
  const onChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    if (cookies.token) {
      router("/");
    }
    if (param) {
      setMessage("Account does not exist");
    }
    listenCookieChange(router);
  }, [cookies.token]);

  const onSubmit = async () => {
    if (!!checker()) {
      try {
        const res = await axios.post(
          "https://api.ourworldmeta.com/account/login",
          form,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        const body = res.data;
        console.log(body);
        if (body.token) {
          var date = new Date();
          date.setDate(date.getDate() + 1);
          setCookie("token", body.token, {
            path: "/",
            expires: date,
          });
        }
      } catch (error) {
        setMessage("Account does not exist");
      }
    } else {
      setChecked(true);
    }
  };
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>OUR WORLD!!!</h1>
      <div className={styles.box}>
        <h1>Login to OurWorld</h1>
        <form className={styles.inputsBox} onChange={onChange}>
          <label>Email</label>
          <input
            style={{
              border: checked && !form.email ? "1px solid red" : "",
            }}
            name="email"
            placeholder="Your email"
          ></input>
          <label>Password</label>
          <input
            style={{
              border: checked && !form.password ? "1px solid red" : "",
            }}
            name="password"
            type="password"
            placeholder="xxxxx"
          ></input>
        </form>
        <p style={{ color: "red" }}>{message}</p>
        <div
          style={{
            width: "100%",
            display: "flex",
            height: "7%",
            justifyContent: "center",
          }}
        >
          <button style={{ height: "100%", width: "30%" }} onClick={onSubmit}>
            LOG IN
          </button>
          <a
            target="_blank"
            href="https://api.ourworldmeta.com/oauth/google"
            style={{ height: "100%", width: "15%" }}
          >
            <button
              style={{
                height: "100%",
                width: "100%",
                backgroundColor: "white",
              }}
            >
              <FcGoogle />
            </button>
          </a>
        </div>
        {/* <button id={styles.signup} onClick={() => router("/signup")}>
          SIGN UP
        </button> */}
      </div>
    </div>
  );
};
