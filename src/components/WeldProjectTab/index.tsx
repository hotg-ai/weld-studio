import React from "react";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import ClipLoader from "react-spinners/ClipLoader";
import { BaseDirectory, readDir } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

import Header from "../../components/Header";
import Home from "../../components/Home";
import Dataset from "../../components/Dataset";
import Anaysis from "../../components/Analysis";

import {
  TableData,
  FileDropEvent,
  FieldSchema,
  QueryData,
  AppState,
  WeldProject,
} from "../../types";

import { v4 as uuidv4 } from "uuid";

class WeldProjectTab extends React.Component<WeldProject, WeldProject> {
  state = {
    id: uuidv4(),
    data: [],
    querySchema: { fields: [] },
    sql: undefined,
    queryError: undefined,
    tables: {},
    isLoadingTable: false,
    isQueryLoading: false,
    datasetRegistry: {},
    selectedDatasets: [],
    searchValue: "",
  };

  unsubscribers: UnlistenFn[] = [];

  constructor(props: WeldProject) {
    super(props);
    this.setState({ ...props });
  }

  componentDidMount() {
    listen("tauri://file-drop", (e) => {
      this.eventHandlerFileDrop(e as FileDropEvent);
    }).then((u) => {
      if (u) this.unsubscribers.push(u);
    });

    // let event: FileDropEvent = {
    //   payload: ["/Users/mohit/Desktop/hurricanium.csv"], // Chnage this path to your hurricanium file.
    // };
    // this.eventHandlerFileDrop(event);

    listen("save_started", () => {
      this.setState({ isQueryLoading: true });
    }).then((u) => {
      if (u) this.unsubscribers.push(u);
    });

    listen("save_ended", (saved) => {
      this.setState({
        isQueryLoading: false,
        queryError: `Saved ${saved} records`,
      });
    }).then((u) => {
      if (u) this.unsubscribers.push(u);
    });

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

    listen(
      "load_arrow_row_batch_schema",
      ({ payload }: { payload: { fields: FieldSchema[] } }) =>
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
    this.preloadDatafiles()
      .then(() => {
        this.getTables(true);
      })
      .finally(() => {
        this.getTables();
      });
  }

  async preloadDatafiles() {
    await invoke("log_message", { message: "trying to preload files" });
    try {
      const entries = await readDir("preload_tables", {
        dir: BaseDirectory.Resource,
        recursive: false,
      });

      this.setState({ isLoadingTable: true });
      for (const file of entries) {
        await invoke("log_message", { message: `preloading ${file.path}` });
        console.log(`Entry: ${file.path}`);
        let res = await invoke("load_csv", { invokeMessage: file.path });
        let result = res as string;
      }

      this.setState({ isLoadingTable: false });
      this.setState({ queryError: "Finished loading preloading datasets" });
    } catch (e) {
      await invoke("log_message", { message: e });
      this.setState({ queryError: e.message });
      this.setState({ isLoadingTable: false });
    }
  }

  // constructor(props: any) {
  //   super(props);
  // }

  componentWillUnmount() {
    this.unsubscribers.forEach((u) => u());
  }

  getTables(preload?: boolean) {
    invoke("get_tables", { preload }).then((tableResults: any[]) => {
      const tables = tableResults as TableData[];
      const curTables = this.state.tables;
      tables.forEach((table) => {
        if (!curTables[table.table_name]) {
          curTables[table.table_name] = { ...table, selected: true };
        }
      });
      this.setState({ ...this.state, tables: curTables }, () => {
        console.log("CURRENT TABLE", curTables);
      });
    });
  }

  executeQuery(sql: string) {
    // FIXME: This is a hack so we can test the Rune compiler
    // invoke("compile", { runefile: sql }).then(console.log).catch(console.error);

    // FIXME: This is a hack to make sure the backend can search WAPM for all
    // proc-blocks
    // invoke("known_proc_blocks").then(console.log).catch(console.error);

    this.setState({ data: [], querySchema: { fields: [] } });
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

  eventHandlerLoadArrowRowBatchSchema(schema: { fields: FieldSchema[] }) {
    //     console.log("DATAxxx is ", data.length)
    //console.log("Schema", schema);
    this.setState({ querySchema: schema });
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
    const {
      isLoadingTable,
      data,
      queryError,
      querySchema,
      sql,
      tables,
      isQueryLoading,
      datasetRegistry,
      searchValue,
    } = this.state;

    const filteredData: Record<string, QueryData> = Object.keys(datasetRegistry)
      .filter((dataset_name: string) => {
        const dataset: QueryData = datasetRegistry[dataset_name];
        return (
          dataset_name.toLowerCase().includes(searchValue) ||
          dataset.query.toLowerCase().includes(searchValue)
        );
      })
      .reduce<Record<string, QueryData>>((acc, key) => {
        acc[key] = datasetRegistry[key];
        return acc;
      }, {} as Record<string, QueryData>);

    const selectedDatasets: Record<string, QueryData> = Object.keys(
      datasetRegistry
    )
      .filter((dataset_name: string) => {
        const dataset: QueryData = datasetRegistry[dataset_name];
        return dataset.selected;
      })
      .reduce<Record<string, QueryData>>((acc, key) => {
        acc[key] = datasetRegistry[key];
        return acc;
      }, {} as Record<string, QueryData>);

    const filteredTables: TableData[] = Object.keys(tables)
      .filter((table_name: string) => {
        const t: TableData = tables[table_name];
        return t.table_name.toLowerCase().includes(searchValue);
      })
      .reduce<TableData[]>((acc, key) => {
        acc.push(tables[key]);
        return acc;
      }, [] as TableData[]);

    const selectedTables: TableData[] = Object.keys(tables)
      .filter((table_name: string) => {
        const t: TableData = tables[table_name];
        return t.selected;
      })
      .reduce<TableData[]>((acc, key) => {
        acc.push(tables[key]);
        return acc;
      }, [] as TableData[]);

    return (
      <>
        <div
          className="spinner__container"
          style={{ display: isLoadingTable ? "flex" : "none" }}
        >
          <div className="spinner__body">
            <ClipLoader color="purple" size={25} />{" "}
            <p style={{ paddingLeft: "20px" }}>Loading table ...</p>
          </div>
        </div>
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
                    tables={selectedTables}
                    isQueryLoading={isQueryLoading}
                    datasetRegistry={selectedDatasets}
                    setIsQueryLoading={(isQueryLoading: boolean) =>
                      this.setState({ isLoadingTable: isQueryLoading })
                    }
                    numberSelectedDatasets={
                      Object.keys(selectedDatasets).length
                    }
                    setQueryError={(error: string) =>
                      this.setState({ queryError: error })
                    }
                    selectDataset={(name, toggle) => {
                      this.setState({
                        datasetRegistry: {
                          ...this.state.datasetRegistry,
                          [name]: {
                            ...this.state.datasetRegistry[name],
                            selected: toggle,
                          },
                        },
                      });
                    }}
                    setQueryData={(name: string, query_data: QueryData) =>
                      this.setState({
                        datasetRegistry: {
                          ...this.state.datasetRegistry,
                          [name]: query_data,
                        },
                      })
                    }
                  />
                }
              />
              <Route
                path="/analysis/:id"
                element={
                  <Anaysis
                    datasetRegistry={selectedDatasets}
                    querySchema={querySchema}
                    data={data}
                    queryError={queryError}
                    isLoadingTable={isLoadingTable}
                    setIsLoadingTable={(isLoadingTable: boolean) =>
                      this.setState({ isLoadingTable }, () =>
                        console.log("SETTING IS LOADING TABLE", isLoadingTable)
                      )
                    }
                    setQueryError={(error: string) =>
                      this.setState({ queryError: error })
                    }
                  />
                }
              />
              <Route
                path="/"
                element={
                  <Home
                    setTableGroup={(group, name) => {
                      this.setState({
                        tables: {
                          ...this.state.tables,
                          [name]: {
                            ...this.state.tables[name],
                            group,
                          },
                        },
                      });
                    }}
                    setDatasetGroup={(group, name) => {
                      this.setState({
                        datasetRegistry: {
                          ...this.state.datasetRegistry,
                          [name]: {
                            ...this.state.datasetRegistry[name],
                            group,
                          },
                        },
                      });
                    }}
                    queryError={queryError}
                    clearAllSelected={() => {
                      const tables = Object.keys(this.state.tables).reduce<
                        Record<string, TableData>
                      >((acc, key) => {
                        const tables = this.state.tables;
                        tables[key].selected = false;
                        acc[key] = tables[key];
                        return acc;
                      }, {} as Record<string, TableData>);
                      this.setState({ tables });

                      const datasets = Object.keys(
                        this.state.datasetRegistry
                      ).reduce<Record<string, QueryData>>((acc, key) => {
                        const datasets = this.state.datasetRegistry;
                        datasets[key].selected = false;
                        acc[key] = datasets[key];
                        return acc;
                      }, {} as Record<string, QueryData>);

                      this.setState({ datasetRegistry: datasets });
                    }}
                    setSql={(sql: string) =>
                      this.setState({ sql }, () => this.executeQuery(sql))
                    }
                    numberSelectedDatasets={
                      Object.keys(selectedDatasets).length
                    }
                    numberSelectedTables={selectedTables.length}
                    selectTable={(name, toggle) => {
                      this.setState({
                        tables: {
                          ...this.state.tables,
                          [name]: {
                            ...this.state.tables[name],
                            selected: toggle,
                          },
                        },
                      });
                    }}
                    selectDataset={(name, toggle) => {
                      this.setState({
                        datasetRegistry: {
                          ...this.state.datasetRegistry,
                          [name]: {
                            ...this.state.datasetRegistry[name],
                            selected: toggle,
                          },
                        },
                      });
                    }}
                    searchValue={searchValue}
                    setSearchValue={(searchValue: string) =>
                      this.setState({ searchValue })
                    }
                    datasets={filteredData}
                    tables={Object.values(filteredTables)}
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
      </>
    );
  }
}

/*


  const [searchValue, setSearchValue] = useState("");
  const [datasets, setDatasets] = useState<Record<string, QueryData>>(datasetRegistry);
  //filter by search
  const serachOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    const searchedValue = e.target.value.toLowerCase();
    if (searchedValue === "") {
      setDatasets(datasetRegistry);
    } else {
      const filteredData: Record<string, QueryData> = Object.keys(datasetRegistry).filter((dataset_name: string) => {
        const dataset: QueryData = datasetRegistry[dataset_name];
        return (dataset_name.toLowerCase().includes(searchedValue) || dataset.query.toLowerCase().includes(searchedValue));
      }
      ).reduce<Record<string, QueryData>>((acc, key) => {
        acc[key] = datasetRegistry[key];
        return acc;
      }, {} as Record<string, QueryData>);

      setDatasets(filteredData);
    }
  };


*/

export default WeldProjectTab;
