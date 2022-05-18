import React from "react";
import "./App.css";
import Header from "./components/Header";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Dataset from "./components/Dataset";

import { invoke } from '@tauri-apps/api/tauri'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

import { TableData, FileDropEvent } from './types'

import ClipLoader from "react-spinners/ClipLoader";


type AppState = {
  data: any[],
  sql: string | undefined,
  queryError: string | undefined,
  tables: TableData[],
  isLoadingTable: boolean,
  isQueryLoading: boolean
}

class App extends React.Component<{}, AppState> {

  state: AppState = {
    data: [],
    sql: undefined,
    queryError: undefined,
    tables: [],
    isLoadingTable: false,
    isQueryLoading: false
  }

  unsubscribers: UnlistenFn[] = []

  constructor(props: any) {

    super(props);
    this.getTables();

    listen('tauri://file-drop', (e) => this.eventHandlerFileDrop(e as FileDropEvent))
      .then((u) => {
        if (u)
          this.unsubscribers.push(u)
      });

    listen('load_csv_complete', (payload: unknown) => this.eventHandlerLoadCSVComplete([payload])).then((u) => {
      if (u)
        this.unsubscribers.push(u)
    });

    listen('load_arrow_row_batch', ({ payload }: { payload: any[] }) => this.eventHandlerLoadArrowRowBatch(payload)).then((u) => {
      if (u)
        this.unsubscribers.push(u)
    });

    listen('query_started',  () => this.setState({isQueryLoading: true})).then((u) => {
      if (u)
        this.unsubscribers.push(u)
    });

    listen('query_ended', () => this.setState({isQueryLoading: false})).then((u) => {
      if (u)
        this.unsubscribers.push(u)
    });

  }

  componentWillUnmount() {
    this.unsubscribers.forEach(u => u())
  }


  getTables() {
    invoke('get_tables').then((tableResults: unknown) => {

      this.setState({ ...this.state, tables: tableResults as TableData[] });

    })
  }

  executeQuery(sql: string) {
    if (this.state.isQueryLoading) return

    this.setState({isQueryLoading: true})
    this.setState({sql, queryError: undefined})
    invoke('run_sql', { sql }).then((result) => {
      //let result_typed = result as { records: boolean[] };
      //setData(result_typed.records)
    }).catch(e => {
      this.setState({ queryError: e });
    }).finally(() => this.setState({isQueryLoading: false}))
  }

  eventHandlerLoadArrowRowBatch(chunk: any[]) {
    //     console.log("DATAxxx is ", data.length)
    const newData = [...this.state.data, ...chunk]
    this.setState({ data: newData })
  }

  eventHandlerLoadCSVComplete(payload: any[]) {
    this.setState({ isLoadingTable: false })
    this.getTables();
  }


  eventHandlerFileDrop(event: FileDropEvent) {

    this.setState({ isLoadingTable: true })
    console.log("SET LOADING TABLE TRUE")
    let files = (event.payload as string[]);
    if (files.length > 0) {

      invoke('load_csv', { invokeMessage: files[0] }).then((res) => {
        let result = res as string;
        this.setState({ queryError: `${files[0]} loaded as ${result}` });
      }).catch((e) => {
        this.setState({ isLoadingTable: false })
        this.setState({ queryError: e });
      });

    }
  }


  render() {
    const { isLoadingTable, data, queryError, sql, tables, isQueryLoading } = this.state;
    return (
      <div className="App">
        <div className="spinner__container" style={{ display: isLoadingTable ? "flex" : "none" }}>

          <div className="spinner__body">
            <ClipLoader color="purple" size={25} /> <p style={{ paddingLeft: "20px" }}>Loading table ...</p>
          </div>
        </div>
        <Header />
        <div className="dashboard__container">
          <Router>
            <Routes>
              <Route path="/dataset/:id" element={<Dataset data={data} queryError={queryError} sql={sql} setSql={(sql: string) => this.executeQuery(sql)} tables={tables} isQueryLoading={isQueryLoading} />} />
              <Route path="/" element={<Home />} />
            </Routes>
          </Router>
        </div>

      </div>
    );
  }


}

export default App;
