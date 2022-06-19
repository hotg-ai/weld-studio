import React, { useEffect, useState } from "react";
import "./home.css";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";

import { useNavigate } from "react-router";
import { QueryData, TableData } from "src/types";
import { testDatasetScreenshot, sqlTableIcon, databaseIcon } from "../../assets";
import { Checkbox } from "antd";
import { Link } from "react-router-dom";
import { addDatasetIcon } from "../../assets";

function Home({
  setQueryError,
  setIsLoadingTable,
  datasets,
  selectDataset,
  selectTable,
  searchValue,
  setSearchValue,
  clearAllSelected,
  setTableGroup,
  setDatasetGroup,
  numberSelectedDatasets,
  numberSelectedTables,
  tables,
  queryError,
  setSql
}: {
  setQueryError: (error: string) => void;
  setIsLoadingTable: (isLoading: boolean) => void;
  datasets: Record<string, QueryData>;
  numberSelectedDatasets: number;
  numberSelectedTables: number;
  selectTable: (dataset: string, toggle: boolean) => void;
  selectDataset: (dataset: string, toggle: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  setSql: (sql: string) => void;
  clearAllSelected: () => void;
  tables: TableData[];
  setTableGroup: (group: string, table_name: string) => void;
  setDatasetGroup: (group: string, table_name: string) => void;
  queryError: string;
}) {
  const history = useNavigate();

  return (
    <div className="home__container">
      {/* <div className="home_sidebar">

      </div> */}
      <div className="home_content">
        <div className="home_content-header">
          <div className="dataset_amount_container" style={{ flex: 6 }}>
            <h5>Get Started</h5>
          </div>

          {numberSelectedDatasets + numberSelectedTables > 0 && (<button className="clearall_btn" onClick={clearAllSelected}>X</button>)}
          <form className="search_container">
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <div className="search-icon__container">
              <img src="/assets/searchIcon.svg" alt="" />
            </div>
          </form>
        </div>

        <div className="datasets__container">
          <div
            className="prepareDatasetBtn"
            onClick={async () => {
              const file = await open({
                title: "Select a CSV file",
                filters: [
                  {
                    extensions: ["csv", "tsv", "txt"],
                    name: "delimited files",
                  },
                ],
              });

              if (file) {
                setIsLoadingTable(true);
                invoke("load_csv", { invokeMessage: file })
                  .then((res) => {
                    let result = res as string;
                    setQueryError(`${file} loaded as ${result}`);
                    setIsLoadingTable(false);

                    history("/dataset/1", { replace: true });
                    //  this.setState({ queryError: `${files[0]} loaded as ${result}` });
                  })
                  .catch((e) => {
                    setIsLoadingTable(false);
                    setQueryError(e.message);

                    history("/dataset/1", { replace: true });
                  });
              }
            }}
          >
            <img src={addDatasetIcon} alt="" />
            <span>Add Table or Analysis Features</span>
          </div>
          {datasets &&
            Object.keys(datasets).map((name: string, idx: number) => {
              const dataset: QueryData = datasets[name];
              return (
                <DatasetBox
                  key={name}
                  id={idx}
                  selected={dataset.selected}
                  isSelectable={true}
                  isDataset={true}
                  title={name}
                  group={dataset.group}
                  setGroup={(group) => {
                    setDatasetGroup(group, name)
                  }}
                  onClick={() => {
                    selectDataset(name, true);
                    history(`/analysis/${idx + 1}`, { replace: true });
                  }}
                  selectDataset={(toggle) => selectDataset(name, toggle)}
                />
              );
            })}
          {tables &&
            tables.map((table: TableData, idx: number) => {
              return (
                <DatasetBox
                  key={table.table_name}
                  id={idx}
                  selected={table.selected}
                  isSelectable={true}
                  isDataset={false}
                  title={`${table.table_name}`}
                  group={table.group}
                  setGroup={(group) => {
                    setTableGroup(group, table.table_name)
                  }}
                  onClick={() => {
                    selectTable(table.table_name, true);
                    setSql(`select * from ${table.table_name} limit 10`)
                    history(`/dataset/${idx + 1}`, { replace: true });

                  }}
                  selectDataset={(toggle) => selectTable(table.table_name, toggle)} />
              )
            })
          }
        </div>
        <div className="analysisBtn__container">
          <div className='error__container'>{queryError || (numberSelectedDatasets + numberSelectedTables === 0 ? "Select Tables or Datasets to start" : ``)}</div>
          <div className="analysisBtns">
            <button
              disabled={numberSelectedTables === 0}
              style={{
                backgroundColor:
                  numberSelectedTables === 0 ? "gray" : "#00b594",
              }}
              onClick={async () => {

                setSql("");
                history("/dataset/1");
                // const file = await open({
                //   title: "Select a CSV file",
                //   filters: [{ "extensions": ['csv', 'tsv', 'txt'], "name": "delimited files" }]
                // })

                // if (file) {
                //   setIsLoadingTable(true);
                //   invoke("load_csv", { invokeMessage: file })
                //     .then((res) => {
                //       let result = res as string;
                //       setQueryError(`${file} loaded as ${result}`);
                //       setIsLoadingTable(false);

                //       history("/dataset/1", { replace: true });
                //       //  this.setState({ queryError: `${files[0]} loaded as ${result}` });
                //     })
                //     .catch((e) => {
                //       setIsLoadingTable(false)
                //       setQueryError(e.message);

                //       history("/dataset/1", { replace: true });
                //     });
                // }
              }}
            >
              Query Data
            </button>
            <button
              disabled={numberSelectedDatasets === 0}
              style={{
                backgroundColor:
                  numberSelectedDatasets === 0 ? "gray" : "#00b594",
              }}
              onClick={async () => {
                history("/analysis/1");
                // const file = await open({
                //   title: "Select a CSV file",
                //   filters: [{ "extensions": ['csv', 'tsv', 'txt'], "name": "delimited files" }]
                // })

                // if (file) {
                //   setIsLoadingTable(true);
                //   invoke("load_csv", { invokeMessage: file })
                //     .then((res) => {
                //       let result = res as string;
                //       setQueryError(`${file} loaded as ${result}`);
                //       setIsLoadingTable(false);

                //       history("/dataset/1", { replace: true });
                //       //  this.setState({ queryError: `${files[0]} loaded as ${result}` });
                //     })
                //     .catch((e) => {
                //       setIsLoadingTable(false)
                //       setQueryError(e.message);

                //       history("/dataset/1", { replace: true });
                //     });
                // }
              }}
            >
              Start Analysis
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;

interface DatasetBoxProps {
  title: string;
  selected: boolean;
  id: number;
  isDataset: boolean;
  isSelectable: boolean;
  onClick: () => void;
  selectDataset: (n: boolean) => void;
  group?: string;
  setGroup: (group: string) => void;
}
const DatasetBox = ({
  id,
  title,
  selected,
  isDataset,
  isSelectable,
  onClick,
  selectDataset,
  group,
  setGroup
}: DatasetBoxProps) => {
  const [showGrpBtn, setShowGrpBtn]  = useState<boolean>(group === undefined);
  const [localGroup, setLocalGroup] = useState<string | undefined>(group);

  return (
    <div className="dataset-box__container" onClick={onClick}>
      <img src={testDatasetScreenshot} alt="" />
      <div className="dataset-box_content">
        <img src={isDataset ? sqlTableIcon : databaseIcon} alt="" />
        <div className="title">
          <h5>{title}</h5>
          {showGrpBtn ?
               <button className="dataset-box__group_btn" onClick={(e ) => {
                e.preventDefault();
                e.stopPropagation();
                setShowGrpBtn(false)}
              }>+ Group</button>
            : <input className="dataset-box__group_input" type="text" onChange={(e) => {
              const value = e.target.value; 
                setLocalGroup(e.target.value)
                 if(value.trim().length !== 0)
                    setGroup(e.target.value)
            }} 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }} value={localGroup}  placeholder="set group" />
          }
        </div>
        <Checkbox
          defaultChecked={selected}
          checked={selected}
          disabled={!isSelectable}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            selectDataset(!selected);
          }}
        />
      </div>
    </div>
  );
};
