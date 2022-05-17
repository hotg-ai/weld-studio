import React from "react";
import "./App.css";
import Header from "./components/Header";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Dataset from "./components/Dataset";
// import { invoke } from "@tauri-apps/api/tauri";
// import { listen } from "@tauri-apps/api/event";

// import MonacoEditor from "react-monaco-editor";

// type FileDropEvent = {
//   payload: string[];
// };
// let handlerRegistered = false;
function App() {
  // const [data, setData] = React.useState<boolean[]>([]);
  // const [tables, setTables] = React.useState<Record<string, boolean>>({});
  // const [sql, setSql] = React.useState<string>("");
  // const [queryError, setQueryError] = React.useState<string | undefined>(
  //   undefined
  // );
  // const handleDrop = React.useCallback(
  //   (event: FileDropEvent) => {
  //     let files = event.payload as string[];
  //     if (files.length > 0 && !tables[files[0]]) {
  //       invoke("load_csv", { invokeMessage: files[0] })
  //         .then((result) => {
  //           setTables({ ...tables, [files[0]]: true });
  //           setQueryError(`${files[0]} loaded as ${result}`);
  //         })
  //         .catch((e) => {
  //           setQueryError(e);
  //         });
  //       setTables({ ok: true });
  //     }
  //   },
  //   [tables]
  // );

  // React.useEffect(() => {
  //   // setData([])
  //   setQueryError(undefined);
  //   invoke("run_sql", { sql })
  //     .then((result) => {
  //       let result_typed = result as { records: boolean[] };
  //       setData(result_typed.records);
  //     })
  //     .catch((e) => {
  //       setQueryError(e);
  //     });
  // }, [sql]);

  // React.useEffect(() => {
  //   if (!handlerRegistered) {
  //     listen("tauri://file-drop", handleDrop);
  //     console.log("registered XXXX", handlerRegistered);
  //     handlerRegistered = true;
  //   }
  // }, [handleDrop]);

  // const options = {
  //   selectOnLineNumbers: true,
  // };

  return (
    <div className="App">
      <Header />

      <div className="dashboard__container">
        <Router>
          <Routes>
            <Route path="/dataset/:id" element={<Dataset />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </Router>
      </div>

      {/* <MonacoEditor
        width="100%"
        height="20vh"
        language="sql"
        theme="vs-dark"
        value={sql}
        options={options}
        onChange={(v) => setSql(v)}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            flex: 10,
            display: "flex",
            flexDirection: "column",
            overflowY: "scroll",
          }}
        >
          <div style={{ flex: 10, display: "flex", flexDirection: "column" }}>
            {data.map((item, index) => {
              return (
                <div
                  key={index}
                  style={{ display: "flex", flexDirection: "row" }}
                >
                  <span>{JSON.stringify(item)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default App;
