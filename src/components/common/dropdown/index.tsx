import React, { useState } from "react";
import "./dropdown.css";

interface props {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  selectBtnIcon?: string;
  onSelect?: () => void;
}

export function Dropdown({ disabled = false, title, children, onSelect, selectBtnIcon }: props) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(true);

  function toggleDropdown() {
    if (!disabled) {
      setDropdownOpen(!dropdownOpen);
    }
  }

  return (
    <div className={`dropdown ${disabled ? "disabled" : ""}`}>
      <button onClick={toggleDropdown} className="dropbtn" style={{ overflowX: "clip" }}>
        <img
          src={`/assets/dropdown${dropdownOpen ? "open" : "Close"}.svg`}
          alt=""
        />
        <span>{title}</span>

        {onSelect ? <button className="dropbtn" onClick={(e) => { e.stopPropagation(); onSelect()} } style={{ display: "inline-block" }}>
          {selectBtnIcon ? <img src={selectBtnIcon} alt="" />: "+"}
        </button> : <></>}
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
