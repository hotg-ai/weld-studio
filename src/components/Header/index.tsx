import React from "react";
import "./header.css";
const Header = () => {
  return (
    <div className="header__container">
      <div style={{ width: "12%" }}></div>
      <a href="/">
        <img
          src="/assets/DeSilo.svg"
          height="35px"
          alt="DeSilo"
          className="header-logo"
        />
      </a>
      <div>
        <span>Powered by</span>
        <a href="https://hotg.ai" target="_blank">
          <img src="/assets/hotg.svg" alt="Hotg" />
        </a>
      </div>
    </div>
  );
};

export default Header;
