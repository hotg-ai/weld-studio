import React from "react";
import "./modal.css";

interface props {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  children: React.ReactNode;
  className: string;
  sidebar?: React.ReactNode;
}
const Modal = ({
  setModalVisible,
  title,
  children,
  className,
  sidebar,
}: props) => {
  return (
    <div
      className={`modal__container ${className ? className : ""}`}
      onClick={(e) => {
        const target = e.target as HTMLDivElement;

        if (Array.from(target.classList).includes("modal__container")) {
          setModalVisible(false);
        }
      }}
    >
      <div
        className="modal"
        style={{ flexDirection: sidebar ? "row" : "column" }}
      >
        {sidebar && <div className="modal__sidebar">{sidebar}</div>}
        <div style={{ width: "100%", height: "100%" }}>
          <div className="modal__header">
            <span>{title}</span>
            <button onClick={() => setModalVisible(false)}>X</button>
          </div>
          <div className="modal__body">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
