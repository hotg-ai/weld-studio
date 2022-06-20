import { Tabs } from "antd";
import React, {useState} from "react";
import { HeaderTabCloseIcon } from "src/assets";
import { WeldProject } from "src/types";
import "./header.css";

const HeaderTabItem = ({name, onSelect, onClose, onEditName}: {name:string, onSelect: () => void, onClose: () => void, onEditName: (name: string) => void}) => {
  const [localName, setLocalName] = useState<string>(name);

  return <div className="header--project_tab_bar_item" onClick={() => onSelect()}>

    <span className="header--project_tab_bar_title">
      <input style={{textAlign: "center", outline: "none", border:"none"}} value={localName} onChange={(e) => { setLocalName(e.currentTarget.value)}} 
        onKeyUp={(e)  => {
          if (e.key === "Enter") {
            onEditName(localName);
          }
        }}
        onBlur={() => setLocalName(name)}
        /> 
      <span className="header--project_tab_bar_delete_x" style={{marginLeft: "20px"}} onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }}>
        <img  alt="" src={HeaderTabCloseIcon} /> </span>

        </span>
    
  </div>
}

const Header = ({weldProjects, onClose, onSelect, onAddTab, onTabNameEdit}: {weldProjects: WeldProject[], onTabNameEdit: (tab:string, name:string) => void, onSelect: (tab: string) => void, onClose: (tab: string) => void,  onAddTab: () => void},) => {
  return (
    <div className="header__container">
      <div className="header--home__tab">
  
          <img
            src="/assets/DeSilo.svg"
            height="35px"
            alt="DeSilo"
            className="header-logo"
          />
        
      </div>
      <div>
        {weldProjects.map((weldProject) => {
          return <HeaderTabItem key={weldProject.id} name={weldProject.name} onClose={() => onClose(weldProject.id)} onEditName={(newName) => onTabNameEdit(weldProject.id, newName)} onSelect={() => onSelect(weldProject.id)}  />
        })}
        <div  className="header--tab__container" onClick={() => onAddTab()}>+</div>
      </div>
      <div>

      </div>
      
    </div>
  );
};

export default Header;
