import React, { useEffect, useState } from "react";
import DatasetCard from "./components/datasetCard";
import "./home.css";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog"

import { useNavigate } from "react-router";
import { QueryData } from "src/types";


function Home({ setQueryError, setIsLoadingTable, datasets, selectDataset, searchValue, setSearchValue, numberSelectedDatasets }:
     { setQueryError: (error: string) => void, setIsLoadingTable: 
       (
        isLoading: boolean) => void,
        datasets: Record<string, QueryData>,  
        numberSelectedDatasets: number,
        selectDataset: (dataset: string, toggle: boolean) => void 
        searchValue: string,
        setSearchValue: (value: string) => void,
    }) {
  const history = useNavigate();



  return (
    <div className="home__container">
      <div className="home_sidebar">

      </div>
      <div className="home_content">
        <div className="home_content-header">
          <div className="dataset_amount_container">
            <h5>Datasets</h5>
            <span className="amount">{datasets && Object.keys(datasets).length}</span>
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

          <div className="upload__container">
            <button onClick={async () => {
              const file = await open({
                title: "Select a CSV file",
                filters: [{ "extensions": ['csv', 'tsv', 'txt'], "name": "delimited files" }]
              })


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
                    setIsLoadingTable(false)
                    setQueryError(e.message);

                    history("/dataset/1", { replace: true });
                  });
              }

            }}>
              Prepare Dataset
            </button>
            <button disabled={numberSelectedDatasets === 0} 
              style={{backgroundColor: numberSelectedDatasets === 0 ? "gray" : "#00b594"}}
              onClick={async () => {
                history('/analysis/1')
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

            }}>
              Start Analysis
            </button>
          </div>
        </div>

        <div className="datasets__container">
          {datasets &&
            Object.keys(datasets).map((name: string, idx: number) => {
              const dataset: QueryData = datasets[name];
              return (
                <DatasetCard  
                  key={name}
                  id={idx}
                  name={name}
                  description={dataset.query}
                  likes={2}
                  selected={dataset.selected}
                  selectDataset={(toggle) => selectDataset(name, toggle)}
                  updateTime={dataset.createdAt}
                  downloads={2}
                />
              );
            })}
        </div>

  
      </div>
    </div>
  );
}

export default Home;
