import React from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownOption } from "./components/dropdown";
import CodeEditor from "./components/editor";
import ProgressBar from "./components/progressBar";
import Table from "./components/table";
import "./dataset.css";

const sampleDatabase = [
  { name: "data-row1", percent: "95%" },
  { name: "data-row2", percent: "58%" },
  { name: "data-row3", percent: "12%" },
  { name: "data-row4", percent: "75%" },
  { name: "data-row5", percent: "2%" },
];
const Dataset = () => {
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
          <CodeEditor />
        </div>
        <div className="table__container">
          <Table />
        </div>
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
