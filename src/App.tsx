import React from "react";



import "./App.css";
import Header from "./components/Header";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Dataset from "./components/Dataset";
import Anaysis from "./components/Analysis";

import { invoke } from "@tauri-apps/api/tauri";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

import { TableData, FileDropEvent, FieldSchema } from "./types";

import ClipLoader from "react-spinners/ClipLoader";

type AppState = {
  data: any[];
  querySchema: {fields: FieldSchema[]}
  sql: string | undefined;
  queryError: string | undefined;
  tables: TableData[];
  isLoadingTable: boolean;
  isQueryLoading: boolean;
};

class App extends React.Component<{}, AppState> {
  state: AppState = {
    data: [],
    querySchema: {fields: []},
    sql: undefined,
    queryError: undefined,
    tables: [],
    isLoadingTable: false,
    isQueryLoading: false,
  };

  unsubscribers: UnlistenFn[] = [];

  constructor(props: any) {
    super(props);
    this.getTables();

    listen("tauri://file-drop", (e) => {
      this.eventHandlerFileDrop(e as FileDropEvent);
    }).then((u) => {
      if (u) this.unsubscribers.push(u);
    });

    // let event: FileDropEvent = {
    //   payload: ["/Users/mohit/Desktop/hurricanium.csv"], // Chnage this path to your hurricanium file.
    // };
    // this.eventHandlerFileDrop(event);

    listen("load_csv_complete", (payload: unknown) =>
      this.eventHandlerLoadCSVComplete([payload])
    ).then((u) => {
      if (u) this.unsubscribers.push(u);
    });

    listen("load_arrow_row_batch", ({ payload }: { payload: any[] }) =>
      this.eventHandlerLoadArrowRowBatch(payload)
    ).then((u) => {
      if (u) this.unsubscribers.push(u);
    });

    listen("load_arrow_row_batch_schema", ({ payload }: { payload: {fields: FieldSchema[]} }) =>
    this.eventHandlerLoadArrowRowBatchSchema(payload)
  ).then((u) => {
    if (u) this.unsubscribers.push(u);
  });

    listen("query_started", () => this.setState({ isQueryLoading: true })).then(
      (u) => {
        if (u) this.unsubscribers.push(u);
      }
    );

    listen("query_ended", () => this.setState({ isQueryLoading: false })).then(
      (u) => {
        if (u) this.unsubscribers.push(u);
      }
    );
  }

  componentWillUnmount() {
    this.unsubscribers.forEach((u) => u());
  }

  getTables() {
    invoke("get_tables").then((tableResults: unknown) => {
      this.setState({ ...this.state, tables: tableResults as TableData[] });
    });
  }

  executeQuery(sql: string) {
    // FIXME: This is a hack so we can test the Rune compiler
    // invoke("compile", { runefile: sql }).then(console.log).catch(console.error);

    // FIXME: This is a hack to make sure the backend can search WAPM for all
    // proc-blocks
    // invoke("known_proc_blocks").then(console.log).catch(console.error);

    this.setState({ data: [], querySchema: {fields: []} });
    if (this.state.isQueryLoading) return;

    this.setState({ isQueryLoading: true });
    this.setState({ sql, queryError: undefined });
    invoke("run_sql", { sql })
      .then((result) => {
        //let result_typed = result as { records: boolean[] };
        //setData(result_typed.records)
      })
      .catch((e) => {
        //Note: e is an object and we can't put the entire object in jsx as queryError,So we need to set queryError to the message property of the e object.
        this.setState({ queryError: e }, () => {
          console.log(this.state);
        });
      })
      .finally(() => this.setState({ isQueryLoading: false }));
  }

  eventHandlerLoadArrowRowBatch(chunk: any[]) {
    //     console.log("DATAxxx is ", data.length)
    const newData = [...this.state.data, ...chunk];
    this.setState({ data: newData });
  }

  eventHandlerLoadArrowRowBatchSchema(schema: {fields: FieldSchema[]}) {
    //     console.log("DATAxxx is ", data.length)
    //console.log("Schema", schema);
    this.setState({querySchema: schema})
    // const newData = [...this.state.data, ...chunk];
    // this.setState({ schema: newSchema });
  }


  eventHandlerLoadCSVComplete(payload: any[]) {
    this.setState({ isLoadingTable: false });
    this.getTables();
  }

  eventHandlerFileDrop(event: FileDropEvent) {
    if (!event.payload || (event.payload && event.payload.length === 0)) {
      return;
    }
    this.setState({ isLoadingTable: true });
    let files = event.payload as string[];
    if (files.length > 0) {
      invoke("load_csv", { invokeMessage: files[0] })
        .then((res) => {
          let result = res as string;
          this.setState({ queryError: `${files[0]} loaded as ${result}` });
        })
        .catch((e) => {
          this.setState({ isLoadingTable: false });
          this.setState({ queryError: e.message });
        });
    }
  }

  render() {
    const { isLoadingTable, data, queryError, querySchema, sql, tables, isQueryLoading } =
      this.state;
    return (
      <div className="App">
        <div
          className="spinner__container"
          style={{ display: isLoadingTable ? "flex" : "none" }}
        >
          <div className="spinner__body">
            <ClipLoader color="purple" size={25} />{" "}
            <p style={{ paddingLeft: "20px" }}>Loading table ...</p>
          </div>
        </div>
        <Header />
        <div className="dashboard__container">
          <Router>
            <Routes>
              <Route
                path="/dataset/:id"
                element={
                  <Dataset
                    data={data}
                    querySchema={querySchema}
                    queryError={queryError}
                    sql={sql}
                    setSql={(sql: string) => this.executeQuery(sql)}
                    tables={tables}
                    isQueryLoading={isQueryLoading}
                  />
                }
              />
              <Route path="/analysis/:id" element={<Anaysis 
                    querySchema={querySchema} data={data} />} />
              <Route
                path="/"
                element={
                  <Home
                    setQueryError={(queryError) =>
                      this.setState({ queryError })
                    }
                    setIsLoadingTable={(isLoadingTable) =>
                      this.setState({ isLoadingTable })
                    }
                  />
                 
                  // <div style={{ height:"calc(100vh - 35px)", width: "calc(100vw - 5px)"}}>
                  //     <Flow />
                  // </div>
                }
              />
            </Routes>
          </Router>
        </div>
      </div>
    );
  }
}



export default App;
