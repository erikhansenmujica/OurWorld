import React, { Dispatch, SetStateAction } from "react";
import styles from "../App.module.css";

export const ConfirmModal = ({
  modal,
  setModal,
}: {
  selectedPolygons: String[];
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
  modalConfirmation: any;
}) => (
  <div
    className={styles.menuContentContainer}
    style={{
      display: modal ? "flex" : "none",
      textAlign: "center",
      width: "100%",
    }}
  >
    <h3>Metamask is not installed</h3>
    <h4>Do you want to download it?</h4>
    <div
      className={styles.confirmButtonsContainer}
      style={{ width: "100%", justifyContent: "center" }}
    >
      <button
        className={styles.button}
        id={styles.cancelButton}
        onClick={() => setModal(false)}
      >
        CANCEL
      </button>
      <button
        className={styles.button}
        id={styles.confirmButton}
        onClick={() => {
          window.open("https://metamask.io/download/", "_blank");
        }}
      >
        DOWNLOAD
      </button>
    </div>
  </div>
);
