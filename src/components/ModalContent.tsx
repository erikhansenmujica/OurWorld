import React, { Dispatch, SetStateAction } from "react";
import styles from "../App.module.css";

export const ModalContent = ({
  selectedPolygons,
  modal,
  modalConfirmation,
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
    <h3>This action will delete your current selection</h3>
    <h4>Continue?</h4>
    <h4>Number of tiles: {selectedPolygons.length}</h4>
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
        onClick={modalConfirmation}
      >
        CONFIRM
      </button>
    </div>
  </div>
);
