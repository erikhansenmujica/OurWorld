import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Viewer } from "resium";
import { FcGoogle } from "react-icons/fc";
import styles from "./Register.module.css";
import { listenCookieChange } from "../../utils/cookieListener";
export const Register = () => {
  const [form, setForm] = useState<{
    names: string;
    surnames: string;
    email: string;
    password: string;
    repeatedPassword: string;
  }>({
    email: "",
    names: "",
    surnames: "",
    password: "",
    repeatedPassword: "",
  });
  const [checked, setChecked] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const checker = () => {
    return (
      form.email &&
      form.password &&
      form.surnames &&
      form.names &&
      form.password === form.repeatedPassword
    );
  };
  const navigate = useNavigate();
  useEffect(() => {
    listenCookieChange(navigate);
  }, []);
  const onChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const onSubmit = async () => {
    let { repeatedPassword, ...y } = form;
    if (!!checker()) {
      try {
        const res = await axios.post(
          "https://api.ourworldmeta.com/account",
          y,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        if (res.data.email) {
          setMessage("Account created");
        }
      } catch (error) {
        console.log(error);
        setMessage("Error");
      }
    } else {
      setChecked(true);
    }
  };
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>OUR WORLD</h1>

      <div className={styles.box}>
        <h1>Sign Up to OurWorld</h1>
        <form className={styles.inputsBox} onChange={onChange}>
          <label>Name</label>
          <input
            style={{
              border: checked && !form.names ? "1px solid red" : "",
            }}
            defaultValue={form.names}
            name="names"
            placeholder="Your name"
          ></input>
          <label>Surnames</label>
          <input
            style={{
              border: checked && !form.surnames ? "1px solid red" : "",
            }}
            defaultValue={form.surnames}
            name="surnames"
            placeholder="Your surnames"
          ></input>
          <label>Email</label>
          <input
            style={{
              border: checked && !form.email ? "1px solid red" : "",
            }}
            defaultValue={form.email}
            name="email"
            placeholder="Your email"
          ></input>
          <label>Password</label>
          <input
            style={{
              border:
                (checked && !form.password) ||
                form.password !== form.repeatedPassword
                  ? "1px solid red"
                  : "",
            }}
            defaultValue={form.password}
            name="password"
            type="password"
            placeholder="xxxxx"
          ></input>
          <label>Repeat it</label>
          <input
            style={{
              border:
                (checked && !form.repeatedPassword) ||
                form.password !== form.repeatedPassword
                  ? "1px solid red"
                  : "",
            }}
            defaultValue={form.repeatedPassword}
            name="repeatedPassword"
            type="password"
            placeholder="xxxxx"
          ></input>
        </form>
        <p style={{ color: message.includes("created") ? "green" : "red" }}>
          {message}
        </p>
        <div
          style={{
            width: "100%",
            display: "flex",
            height: "7%",
            justifyContent: "center",
          }}
        >
          <button style={{ height: "100%", width: "30%" }} onClick={onSubmit}>
            SIGN UP
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
        <button id={styles.signup} onClick={() => navigate("/login")}>
          GO TO LOG IN
        </button>
      </div>
    </div>
  );
};
