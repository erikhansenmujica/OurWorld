import React, { Dispatch, SetStateAction } from "react";
import { CgChevronRightO, CgChevronLeftO } from "react-icons/cg";
import styles from "../App.module.css";
export const SideBar = ({
  menu,
  setMenu,
}: {
  menu: boolean;
  setMenu: Dispatch<SetStateAction<boolean>>;
}) => (
  <div
    className={styles.openAndCloseMenuContainer}
    onClick={() => setMenu(!menu)}
  >
    {menu ? (
      <CgChevronLeftO
        style={{
          fontSize: "35px",
          color: "white",
        }}
      />
    ) : (
      <CgChevronRightO
        style={{
          fontSize: "35px",
          color: "white",
        }}
      />
    )}
  </div>
);
