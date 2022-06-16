import React, { useEffect, useState } from "react";
import "./home.css";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";

import { useNavigate } from "react-router";
import { QueryData } from "src/types";
import { testDatasetScreenshot, sqlTableIcon } from "../../assets";
import { Checkbox } from "antd";
import { Link } from "react-router-dom";
import { addDatasetIcon } from "../../assets";

function Home({
  setQueryError,
  setIsLoadingTable,
  datasets,
  selectDataset,
  searchValue,
  setSearchValue,
  numberSelectedDatasets,
}: {
  setQueryError: (error: string) => void;
  setIsLoadingTable: (isLoading: boolean) => void;
  datasets: Record<string, QueryData>;
  numberSelectedDatasets: number;
  selectDataset: (dataset: string, toggle: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}) {
  const history = useNavigate();

  return (
    <div className="home__container">
      {/* <div className="home_sidebar">

      </div> */}
      <div className="home_content">
        <div className="home_content-header">
          <div className="dataset_amount_container">
            <h5>Select DataSet(s)</h5>
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
        <div className="analysisBtn__container">
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
  );
}

export default Home;

interface DatasetBoxProps {
  title: string;
  selected: boolean;
  id: number;
  selectDataset: (n: boolean) => void;
}
const DatasetBox = ({
  id,
  title,
  selected,
  selectDataset,
}: DatasetBoxProps) => {
  return (
    <div className="dataset-box__container">
      <img src={testDatasetScreenshot} alt="" />
      <div className="dataset-box_content">
        <img src={sqlTableIcon} alt="" />
        <div className="title">
          <Link to={`/dataset/${id}`}>
            <h5>{title}</h5>
          </Link>
          <span>15 May 2022</span>
        </div>
        <Checkbox
          defaultChecked={selected}
          onClick={() => {
            selectDataset(!selected);
          }}
        />
      </div>
    </div>
  );
};
