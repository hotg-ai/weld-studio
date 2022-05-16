import React from 'react';
import './App.css';

import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

import MonacoEditor from 'react-monaco-editor';

type FileDropEvent = {
  payload: string[]
}

function App() {
  const [data, setData] = React.useState<boolean[]>([]);
  const [tables, setTables] = React.useState<Record<string, boolean>>({});
  const [sql, setSql] = React.useState<string>("");
  const [queryError, setQueryError] = React.useState<string | undefined>(undefined);
  const handleDrop = React.useCallback(async (event: FileDropEvent) => {
    console.log(event)
    let files = (event.payload as string[]);

    if (files.length > 0) {
      
      await invoke('load_csv', { invokeMessage: files[0] })
      setTables({"ok":  true})
    }
  }, [])


  React.useEffect( () => {
    setData([])
    setQueryError(undefined)
    invoke('run_sql', { sql }).then((result) => {
      let result_typed = result as {records: boolean[]};
      setData(result_typed.records)
    }).catch(e => {
      console.log(e);
      setQueryError(e)
    })
  }, [sql])
  React.useEffect(() => {
    console.log("registered", handleDrop)
    listen('tauri://file-drop', handleDrop)
  }, []);

  const options = {
    selectOnLineNumbers: true
  };

  return (
    <div className="App">
      
      <MonacoEditor
        width="100%"
        height="20vh"
        language="sql"
        theme="vs-dark"
        value={sql}
        options={options}
        onChange={(v) => setSql(v)}
      
      />

      <div style={{color: "red"}}>{queryError}</div>
        { data.length > 0 &&<table>
          <thead><tr><td>Foo</td></tr></thead>
          <tbody>
          {
            data.map((item, index) => {
              return <tr key={index}><td>{item ? "HI" : "BOO"}</td></tr>
            })
          }
          </tbody>
        </table>}
    </div>
  );
}

export default App;
