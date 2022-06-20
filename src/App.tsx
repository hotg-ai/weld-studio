import React from "react";

import "./App.css";
import { AppState, WeldProject } from "./types";
import WeldProjectTab from './components/WeldProjectTab'
import Header from "./components/Header";

import {v4 as uuidv4} from 'uuid'

class App extends React.Component<{}, AppState> {
  state = {
    selectedTab: 0,
    tabs: []
  }

  addTab() {
    const tabs: WeldProject[] = this.state.tabs; 
    
    tabs.push({
      id: uuidv4(),
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
    this.setState({tabs})
  }
  
  render(): React.ReactNode {
    //const tabs = this.state.tabs.map((t) => t.name);
    const tabState = this.state.tabs[0]
    return (<div className="App" >
      
      <Header weldProjects={this.state.tabs} 
      
      onSelect={(tab) => {}}
      
      onClose={(tabId) => {
        const newTabs = this.state.tabs.filter((t) => t.id !== tabId);
        console.log(newTabs, this.state.tabs)
        this.setState({tabs: newTabs});
      }} 
      
      onTabNameEdit={(tab, name) => {
        
        const tabs = this.state.tabs.map((t) => {
          if (t.name === tab ) {
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
