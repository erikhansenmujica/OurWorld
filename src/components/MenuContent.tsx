import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "../App.module.css";
import { FiLogOut } from "react-icons/fi";
import { FaWallet } from "react-icons/fa";
import wallet from "../utils/wallet";
export const MenuContent = ({
  selectedPolygons,
  menu,
  onBuyLand,
  loading,
  setLoading,
  removeCookies,
  connectToWallet,
  setModal,
}: {
  selectedPolygons: String[];
  menu: boolean;
  onBuyLand: any;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setModal: Dispatch<SetStateAction<boolean>>;
  removeCookies: any;
  connectToWallet: () => void;
}) => {
  const [address, setAddress] = useState<any>(null);
  useEffect(() => {
    getAdress();
  }, []);
  const getAdress = async () => {
    const res = await wallet.getWallet();
    setAddress(res);
  };
  return (
    <div
      className={styles.menuContentContainer}
      style={{
        display: menu ? "flex" : "none",
        width: "100%",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {address ? (
        <div className={styles.walletButton}>
          <p>token:{address.balance.token}</p>
          <p>balance:{address.balance.balance}</p>
        </div>
      ) : (
        <div
          className={styles.walletButton}
          onClick={() => {
            connectToWallet();
          }}
        >
          <span className={styles.tooltiptext}>Connect Wallet</span>
          <FaWallet />
        </div>
      )}
      <div
        className={styles.logoutButton}
        onClick={() => {
          removeCookies("token");
        }}
      >
        <span className={styles.tooltiptext}>Log out</span>

        <FiLogOut />
      </div>
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
          <button
            className={styles.button}
            onClick={() => setModal(true)}
            id={styles.cancelButton}
          >
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
};
