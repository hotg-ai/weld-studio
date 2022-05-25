import React from "react";
import "./header.css";
const Header = () => {
  return (
    <div className="header__container">
      <img src="/assets/DeSilo.svg" height="35px" alt="DeSilo" className="header-logo" />
      <div>
        <span>Powered by</span>
        <a href="www.google.com">
          <img src="/assets/hotg.svg" alt="Hotg" />
        </a>
      </div>
    </div>
  );
};

export default Header;
