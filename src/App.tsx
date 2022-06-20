import React from "react";

import "./App.css";
import { AppState, WeldProject } from "./types";
import WeldProjectTab from './components/WeldProjectTab'
import Header from "./components/Header";

import {v4 as uuidv4} from 'uuid'

class App extends React.Component<{}, AppState> {
  state : AppState = {
    selectedTab: undefined,
    tabs: []
  } 

  addTab() {
    const tabs: WeldProject[] = this.state.tabs; 
    const id = uuidv4();
    tabs.push({
      id ,
      name: `Weld ${this.state.tabs.length}`,
      data: [],
      querySchema: { fields: [] },
      sql: undefined,
      queryError: undefined,
      tables: {},
      isLoadingTable: false,
      isQueryLoading: false,
      datasetRegistry: {},
      selectedDatasets: [],
      searchValue: '',  
    });
    this.setState({tabs, selectedTab: this.state.selectedTab ? this.state.selectedTab: id})
  }
  
  render(): React.ReactNode {
    //const tabs = this.state.tabs.map((t) => t.name);
    const tabState = this.state.tabs[0]
    return (<div className="App" >
      
      <Header selectedTabId={this.state.selectedTab} weldProjects={this.state.tabs} 
      
      onSelect={(selectedTab) => this.setState({selectedTab})}
      
      onClose={(tabId) => {
        const newTabs = this.state.tabs.filter((t) => t.id !== tabId);

        this.setState({tabs: newTabs});
      }} 
      
      onTabNameEdit={(tabId, name) => {
        
        const tabs = this.state.tabs.map((t) => {
          if (t.id === tabId ) {
            t.name = name
          } 
          return t
        })

        this.setState({tabs})

      }} onAddTab={() => this.addTab()}/>
      <WeldProjectTab {...tabState} />
      
    </div>);
  }
}

export default App;
