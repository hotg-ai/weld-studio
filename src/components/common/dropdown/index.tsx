import React, { useState } from "react";
import "./dropdown.css";

interface props {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Dropdown({ disabled = false, title, children }: props) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(true);

  function toggleDropdown() {
    if (!disabled) {
      setDropdownOpen(!dropdownOpen);
    }
  }

  return (
    <div className={`dropdown ${disabled ? "disabled" : ""}`}>
      <button onClick={toggleDropdown} className="dropbtn">
        <img
          src={`/assets/dropdown${dropdownOpen ? "open" : "Close"}.svg`}
          alt=""
        />
        {title}
      </button>
      <div
        id="myDropdown"
        className={`dropdown-content ${dropdownOpen ? "show" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

export function DropdownOption(props: any) {
  return <div className="dropdown_item">{props.children}</div>;
}
