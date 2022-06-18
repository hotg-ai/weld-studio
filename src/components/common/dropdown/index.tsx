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
    <div className={`dropdown ${disabled ? "disabled" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <button onClick={toggleDropdown} className="dropbtn" style={{ overflowX: "clip" }}>
          <img
            src={`/assets/dropdown${dropdownOpen ? "open" : "Close"}.svg`}
            alt=""
          />
          <span>{title}</span>
        </button>
        {onSelect ? <button className="dropbtn"  onClick={(e) => { e.stopPropagation(); onSelect() }} style={{ display: "inline-block", maxWidth: "30%" }}>
          {selectBtnIcon ? <img src={selectBtnIcon} alt="" /> : "+"}
        </button> : <></>}
      </div>
      <div
        id="myDropdown"
        className={`dropdown-content ${dropdownOpen ? "show" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

export function DropdownOption({ children, onClick, btnIcon, title }: { children: React.ReactNode, onClick?: () => void, title?: string, btnIcon?: string }) {
  return <div className="dropdown_item">
    <span>{onClick ? <img style={{paddingRight: "5px"}} src={btnIcon} onClick={onClick} alt=""/>: <></>}<b>{title}</b></span>
    {children}
  </div>;
}

// export function DropdownOption({ children, onClick, btnIcon, title }: { children: React.ReactNode, onClick?: () => void, title?: string, btnIcon?: string }) {
//   return <div className="dropdown_item">
//     {/* <span>{title} {onClick ? <img src={btnIcon} onClick={onClick} alt=""/>: <></>}</span> */}
//     {children}
//   </div>;
// }