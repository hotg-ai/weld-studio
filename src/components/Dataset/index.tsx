import React from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownOption } from "./components/dropdown";
import CodeEditor from "./components/editor";
import ProgressBar from "./components/progressBar";
import Table from "./components/table";
import "./dataset.css";


import { invoke } from '@tauri-apps/api/tauri'
import { listen, UnlistenFn } from '@tauri-apps/api/event'


type FileDropEvent = {
  payload: string[]
}

const sampleDatabase = [
  { name: "data-row1", percent: "95%" },
  { name: "data-row2", percent: "58%" },
  { name: "data-row3", percent: "12%" },
  { name: "data-row4", percent: "75%" },
  { name: "data-row5", percent: "2%" },
];

let handlerRegistered = false;
const Dataset = () => {

  const [data, setData] = React.useState<any[]>([]);
  const [tables, setTables] = React.useState<Record<string, boolean>>({});
  const [sql, setSql] = React.useState<string | undefined>(undefined);
  const [queryError, setQueryError] = React.useState<string | undefined>(undefined);
  const handleDrop = React.useCallback((event: FileDropEvent) => {

    let files = (event.payload as string[]);
    if (files.length > 0 && !tables[files[0]]) {
      invoke('load_csv', { invokeMessage: files[0] }).then((result) => {
        setTables({ ...tables, [files[0]]: true })
        setQueryError(`${files[0]} loaded as ${result}`);
      }).catch((e) => {
        setQueryError(e);
      });
      setTables({ "ok": true })
    }
  }, [tables])

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
    // setData([])
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
    setData([...data, ...chunk]);

  }, [])


  React.useEffect(() => {
    // setData([])
    // listen to the `click` event and get a function to remove the event listener
    // there's also a `once` function that subscribes to an event and automatically unsubscribes the listener on the first event
    (async () => {

      const unlisten = await listen('load_arrow_row_batch', ({ payload }: { payload: any[] }) => handleLoadArrowRowBatch(payload))
    })()


  }, [data])


  return (
    <div className="dataset__container">
      <div className="dataset__sidebar__container left">
        <div className="back-link__container">
          <Link to="/">
            <img src="/assets/backArrow.svg" alt="<" />
            <span>Back to Datasets</span>
          </Link>
        </div>
        <div className="tables__container">
          <div className="title">
            <img src="/assets/table.svg" alt="" />
            <span>Tables</span>
          </div>
          <Dropdown title="X_Sample_Database">
            {sampleDatabase.map((item) => {
              return (
                <DropdownOption key={item.name}>
                  <div className="dropdownOption__Content">
                    <span>{item.name}</span>
                    <ProgressBar percent={item.percent} />
                  </div>
                </DropdownOption>
              );
            })}
          </Dropdown>
        </div>
        <div className="models__container">
          <div className="title">
            <div>
              <img src="/assets/model.svg" alt="" />
              <span>Models</span>
            </div>
            <button>
              <img src="/assets/addIcon.svg" alt="Add Model" />
            </button>
          </div>
          <Dropdown disabled={true} title="Sample.SQL">
            {""}
          </Dropdown>
        </div>
      </div>

      <div className="dataset__sidebar__container center">
        <div className="code__container">
          <div className="code__container-header">
            <div className="title">
              <img src="/assets/codeIcon.svg" alt="" />
              <span>Sample.SQL</span>
            </div>
            <button>Run SQL</button>
          </div>
          <CodeEditor setSql={(v) => setSql(v)} sql={sql} />
        </div>
        {queryError ? <div className="table_container">{queryError}</div> :
          data.length > 0 ? <div className="table__container">
            <Table data={data} /></div> : <div className="table_container">No data</div>}
      </div>

      <div className="dataset__sidebar__container right">
        <div className="share__container">
          <button>
            <img src="/assets/share.svg" alt="" />
            <span>Share</span>
          </button>
          <div>
            <h5>140,000 Rows , 10 Columns</h5>
            <span>No changes in row count</span>
          </div>
        </div>

        <div className="Sources__container">
          <span>Sources Tables</span>
          <div>
            <span>insurance_database_2022_05 </span>
            <span>140,000 Rows</span>
          </div>
        </div>

        <div className="selectedColumns__container">
          <Dropdown title="X_Sample_Database">
            {sampleDatabase.map((item) => {
              return (
                <DropdownOption key={item.name}>
                  <div className="dropdownOption__Content">
                    <span>{item.name}</span>
                    <ProgressBar percent={item.percent} />
                  </div>
                </DropdownOption>
              );
            })}
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Dataset;
