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


let handlerRegistered = false;
let handlerRegistered3 = false;

function App() {

  const [data, setData] = React.useState<any[]>([]);
  const [sql, setSql] = React.useState<string | undefined>(undefined);
  const [queryError, setQueryError] = React.useState<string | undefined>(undefined);

  const [tables, setTables] = React.useState<TableData[]>([]);

  const [isLoadingTable, setIsLoadingTable] = React.useState<boolean>(false);

  React.useEffect(() => {
    invoke('get_tables').then((tableResults: unknown) => {

      setTables(tableResults as TableData[]);

    })
  }, [])

  const handleDrop = React.useCallback((event: FileDropEvent) => {

    setIsLoadingTable(true);
    console.log("SET LOADING TABLE TRUE")
    let files = (event.payload as string[]);
    if (files.length > 0) {

      invoke('load_csv', { invokeMessage: files[0] }).then((res) => {
        let result = res as string;
        setQueryError(`${files[0]} loaded as ${result}`);
      }).catch((e) => {
        setIsLoadingTable(false);
        setQueryError(e);
      });

    }
  }, [])

  React.useEffect(() => {

    if (!handlerRegistered) {
      let unsubscribe: UnlistenFn | undefined = undefined;
      listen('tauri://file-drop', handleDrop).then((u) => unsubscribe = u);

      handlerRegistered = true;
      return () => {
        // Do unmounting stuff here
        if (unsubscribe)
          unsubscribe();
      };
    }


  }, [handleDrop]);


  React.useEffect(() => {
    setData([])
    setQueryError(undefined)
    if (sql && sql.length > 0) {
      invoke('run_sql', { sql }).then((result) => {
        //let result_typed = result as { records: boolean[] };
        //setData(result_typed.records)
      }).catch(e => {
        setQueryError(e)
      })
    }
  }, [sql])

  const handleLoadArrowRowBatch = React.useCallback((chunk: any[]) => {
    //setData[]
    console.log("DATAxxx is ", data.length)
    const newData = [...data, ...chunk]
    setData(newData)

  }, [data])


    React.useEffect(() => {

      let handlerRegistered2: UnlistenFn | null = null;
      listen('load_arrow_row_batch', ({ payload }: { payload: any[] }) => handleLoadArrowRowBatch(payload)).then((unsubscribe) => handlerRegistered2 = unsubscribe)

      return () => {
        if (handlerRegistered2) {
          console.log("UNSUB")
          handlerRegistered2();
        }

      }

    }, [data, handleLoadArrowRowBatch])

  const handleFetchTableUpdate = React.useCallback((chunk: any[]) => {
    //setData[]

    setIsLoadingTable(false);
    invoke('get_tables').then((tableResults: unknown) => {

      setTables(tableResults as TableData[]);

    })

  }, [])


  React.useEffect(() => {
    // setData([])
    // listen to the `click` event and get a function to remove the event listener
    // there's also a `once` function that subscribes to an event and automatically unsubscribes the listener on the first event

    if (!handlerRegistered3) {
      listen('load_csv_complete', ({ payload }: { payload: any[] }) => handleFetchTableUpdate(payload))
      handlerRegistered3 = true;
      setIsLoadingTable(false);
    }



  }, [handleFetchTableUpdate])


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
            <Route path="/dataset/:id" element={<Dataset data={data} queryError={queryError} setSql={setSql} tables={tables} />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </div>

    </div>
  );
}

export default App;
