import React, { Dispatch, SetStateAction } from "react";
import styles from "../App.module.css";

export const MenuContent = ({
  selectedPolygons,
  menu,
  onBuyLand,
  loading,
  setLoading,
}: {
  selectedPolygons: String[];
  menu: boolean;
  onBuyLand: any;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}) => (
  <div
    className={styles.menuContentContainer}
    style={{
      display: menu ? "flex" : "none",
      width: "100%",
      justifyContent: "center",
      textAlign: "center",
    }}
  >
    <h1>Selected Tiles</h1>
    <h2>Number of tiles: {selectedPolygons.length}</h2>
    <h2>Price by tile: 1.09USDT</h2>
    <h2>
      Total:{" "}
      {Math.round((selectedPolygons.length * 1.09 + Number.EPSILON) * 100) /
        100}
      USDT
    </h2>
    {loading ? (
      <div className={styles.loader} />
    ) : selectedPolygons.length ? (
      <div
        className={styles.confirmButtonsContainer}
        style={{
          width: "100%",
          justifyContent: "center",
        }}
      >
        <button className={styles.button} id={styles.cancelButton}>
          CANCEL
        </button>
        <button
          onClick={onBuyLand}
          className={styles.button}
          id={styles.confirmButton}
        >
          BUY LAND
        </button>
      </div>
    ) : (
      <div />
    )}
  </div>
);
