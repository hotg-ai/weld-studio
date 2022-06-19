import React, { useEffect, useState } from "react";
import "./home.css";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";

import { useNavigate } from "react-router";
import { QueryData, TableData } from "src/types";
import {
  addDatasetIcon,
  testDatasetScreenshot,
  sqlTableIcon,
  databaseIcon,
} from "../../assets";
import { Checkbox } from "antd";
import { Link } from "react-router-dom";
import { CloseOutlined, InfoCircleFilled } from "@ant-design/icons";

function Home({
  setQueryError,
  setIsLoadingTable,
  datasets,
  selectDataset,
  selectTable,
  searchValue,
  setSearchValue,
  clearAllSelected,
  numberSelectedDatasets,
  numberSelectedTables,
  tables,
  queryError,
  setSql,
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
  queryError: string;
}) {
  const history = useNavigate();

  return (
    <div className="home__container">
      {/* <div className="home_sidebar">

      </div> */}
      <div className="home_content">
        <div className="home_content-header">
          <div className="home-header-cards__container">
            <div className="header-card" style={{ background: "#00B59433" }}>
              <div>
                <Link to="/">Start with No Code</Link>
                <img src={databaseIcon} alt="" />
              </div>
              <span>Drag and drop analysis</span>
            </div>
            <div className="header-card" style={{ background: "#DEE5FF" }}>
              <div>
                <Link to="/">Start with SQL</Link>
                <img src={sqlTableIcon} alt="" />
              </div>
              <span>SQL editor analysis</span>
            </div>
          </div>

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
          <h5>Get Started</h5>
          {numberSelectedDatasets + numberSelectedTables > 0 && (
            <div className="clearall_btn" onClick={clearAllSelected}>
              <button>
                <CloseOutlined />
              </button>
              <span>Deselect all</span>
            </div>
          )}
          <div className="dataset-boxes__container">
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
              <span>Prepare Dataset</span>
            </div>
            {datasets &&
              Object.keys(datasets).map((name: string, idx: number) => {
                const dataset: QueryData = datasets[name];
                return (
                  <DatasetBox
                    key={name}
                    id={idx}
                    selected={dataset.selected}
                    title={name}
                    selectDataset={(toggle) => selectDataset(name, toggle)}
                  />
                );
              })}
          </div>
        </div>
        <div className="analysisBtn__container">
          <div className="error__container">
            {queryError ? (
              <>
                <InfoCircleFilled
                  style={{ color: "#0066FF", marginRight: ".5rem" }}
                />
                {queryError}
              </>
            ) : numberSelectedDatasets + numberSelectedTables === 0 ? (
              "Select Tables or Datasets to start"
            ) : (
              ``
            )}
          </div>
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
  isDataset?: boolean;
  isSelectable?: boolean;
  onClick?: () => void;
  selectDataset?: (n: boolean) => void;
}
const DatasetBox = ({
  id,
  title,
  selected,
  isDataset,
  isSelectable,
  onClick,
  selectDataset,
}: DatasetBoxProps) => {
  return (
    <div className="dataset-box__container" onClick={onClick}>
      <img src={testDatasetScreenshot} alt="" />
      <div className="dataset-box_content">
        <img src={isDataset ? sqlTableIcon : databaseIcon} alt="" />
        <div className="title">
          <h5>{title}</h5>
          <span>{new Date().toDateString()}</span>
        </div>
        <Checkbox
          defaultChecked={selected}
          checked={selected}
          // disabled={!isSelectable}
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
