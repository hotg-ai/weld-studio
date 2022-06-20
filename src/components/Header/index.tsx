import { Tabs } from "antd";
import React, { useState } from "react";
import { HeaderTabCloseIcon } from "src/assets";
import { WeldProject } from "src/types";
import "./header.css";

const HeaderTabItem = ({
  name,
  onSelect,
  onClose,
  onEditName,
  selected,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
  onEditName: (name: string) => void;
}) => {
  const [localName, setLocalName] = useState<string>(name);

  return (
    <div
      className="header--project_tab_bar_item"
      style={
        selected
          ? {
              boxShadow: "0px -3.45133px 12.9425px rgba(0, 0, 0, 0.1)",
              zIndex: 10,
            }
          : {}
      }
      onClick={() => onSelect()}
    >
      <span className="header--project_tab_bar_title">
        <input
          style={{
            textAlign: "center",
            outline: "none",
            border: "none",
            backgroundColor: "transparent",
            color: !selected ? "black" : "#00b594",
          }}
          value={localName}
          onChange={(e) => {
            setLocalName(e.currentTarget.value);
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onEditName(localName);
            }
          }}
          onBlur={() => setLocalName(name)}
        />
        <span
          className="header--project_tab_bar_delete_x"
          style={{ marginLeft: "20px" }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
        >
          <img alt="" src={HeaderTabCloseIcon} />{" "}
        </span>
      </span>
    </div>
  );
};

const Header = ({
  weldProjects,
  selectedTabId,
  onClose,
  onSelect,
  onAddTab,
  onTabNameEdit,
}: {
  weldProjects: WeldProject[];
  selectedTabId: string;
  onTabNameEdit: (tab: string, name: string) => void;
  onSelect: (tab: string) => void;
  onClose: (tab: string) => void;
  onAddTab: () => void;
}) => {
  return (
    <div className="header__container">
      {/* <div className="header--home__tab">
  
          <img
            src="/assets/DeSilo.svg"
            height="35px"
            alt="DeSilo"
            className="header-logo"
          />
        
      </div>
      <div>
        {weldProjects.map((weldProject) => {
          return <HeaderTabItem key={weldProject.id} selected={weldProject.id === selectedTabId} name={weldProject.name} onClose={() => onClose(weldProject.id)} onEditName={(newName) => onTabNameEdit(weldProject.id, newName)} onSelect={() => onSelect(weldProject.id)}  />
        })}
        <div  className="header--tab__container__add" onClick={() => onAddTab()}>+</div>
      </div>
      <div>

      </div> */}
      <div style={{ width: "12%" }}></div>
      <a href="/">
        <img
          src="/assets/DeSilo.svg"
          height="35px"
          alt="DeSilo"
          className="header-logo"
        />
        <>WeldStudio <h6>RC-5</h6></> 
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
