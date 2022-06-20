import React, { useEffect, useRef, useState } from "react";
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
  introModalStepOne,
  studioCanvasScreenshot,
  image6,
} from "../../assets";
import { Carousel, Checkbox } from "antd";
import { Link } from "react-router-dom";
import { CloseOutlined, InfoCircleFilled } from "@ant-design/icons";
import Modal from "../Dataset/components/modal";


import { getVersion } from '@tauri-apps/api/app';

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
  setTableGroup: (group: string, table_name: string) => void;
  setDatasetGroup: (group: string, table_name: string) => void;
  queryError: string;
}) {
  const history = useNavigate();
  const [introModalVisible, setIntroModalVisible] = useState(false);

  useEffect(() => {
    setIntroModalVisible(true);
  }, []);

  const [appVersion, setAppVersion] = useState<string | undefined>()

  useEffect( () => {
      getVersion().then((appVersion: string) => {
        setAppVersion(appVersion)
      })
  })

  return (
    <div className="home__container">
      {/* <div className="home_sidebar">

      </div> */}
      <div className="home_content">
        <div className="home_content-header">
          <div className="home-header-cards__container">
            <Link to="/analysis/0">
              <div className="header-card" style={{ background: "#00B59433" }}>
                <div>
                  Start with No Code
                  <img src={databaseIcon} alt="" />
                </div>
                <span>Drag and drop analysis</span>
              </div>
            </Link>
            <Link to="/dataset/0">
              <div className="header-card" style={{ background: "#DEE5FF" }}>
                <div>
                  Start with SQL
                  <img src={sqlTableIcon} alt="" />
                </div>
                <span>SQL editor analysis</span>
              </div>
            </Link>
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
          <i style={{fontSize: "8px"}}>v{appVersion}</i>
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
                    isSelectable={true}
                    isDataset={true}
                    title={name}
                    group={dataset.group}
                    setGroup={(group) => {
                      setDatasetGroup(group, name);
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
                      setTableGroup(group, table.table_name);
                    }}
                    onClick={() => {
                      selectTable(table.table_name, true);
                      setSql(`select * from ${table.table_name} limit 10`);
                      history(`/dataset/${idx + 1}`, { replace: true });
                    }}
                    selectDataset={(toggle) =>
                      selectTable(table.table_name, toggle)
                    }
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
      {introModalVisible && (
        <Modal
          className="intro_modal__container"
          title="Getting started"
          setModalVisible={setIntroModalVisible}
        >
          <p className="modal-description">
            This is a no code editor for you to rapidly test out statistical
            models on your private data. Add and prepare datasets for analysis
            such as logistic/linear etc with 3 steps.
          </p>
          <Carousel arrows prevArrow={<button>Back</button>}>
            <div className="step-one">
              <div className="example-sql__container">
                <img src={introModalStepOne} alt="" />
              </div>
              <p>
                <b>Using the SQL editor</b> you can quickly create datasets.
                Datasets are derived from your private files. For example:
                `select * from datga.csv` Get started by connecting data
              </p>
            </div>
            <div className="step-two">
              <img src={testDatasetScreenshot} alt="" />
              <div className="step-two-content">
                <h3>1. DataSet: Creating features for procblocks</h3>
                <span>To perpare data for logistic regression we will </span>
              </div>
            </div>
            <div className="step-three">
              <img src={studioCanvasScreenshot} alt="" />
              <div className="step-three-content">
                <h3>2. Adding blocks to the canvas</h3>
                <span>To perpare data for logistic regression we will </span>
              </div>
            </div>
            <div className="step-four">
              <img src={image6} alt="" />
              <div className="step-four-content">
                <h3>3. Execute and compare models</h3>
              </div>
            </div>
          </Carousel>
          <button
            className="intro-modal-skip_btn"
            onClick={() => setIntroModalVisible(false)}
          >
            Skip
          </button>
        </Modal>
      )}
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
  setGroup,
}: DatasetBoxProps) => {
  const [showGrpBtn, setShowGrpBtn] = useState<boolean>(group === undefined);
  const [localGroup, setLocalGroup] = useState<string | undefined>(group);

  return (
    <div className="dataset-box__container" onClick={onClick}>
      <img src={testDatasetScreenshot} alt="" />
      <div className="dataset-box_content">
        <img src={isDataset ? sqlTableIcon : databaseIcon} alt="" />
        <div className="title">
          <h5>{title}</h5>
          {showGrpBtn ? (
            <button
              className="dataset-box__group_btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowGrpBtn(false);
              }}
            >
              + Group
            </button>
          ) : (
            <input
              className="dataset-box__group_input"
              type="text"
              onChange={(e) => {
                const value = e.target.value;
                setLocalGroup(e.target.value);
                if (value.trim().length !== 0) setGroup(e.target.value);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              value={localGroup}
              placeholder="set group"
            />
          )}
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
