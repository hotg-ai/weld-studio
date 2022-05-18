import React from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownOption } from "./components/dropdown";
import CodeEditor from "./components/editor";
import ProgressBar from "./components/progressBar";
import Table from "./components/table";
import "./dataset.css";
import { TableData } from "../../types";

import ClipLoader from "react-spinners/ClipLoader";



const Dataset = ({ setSql, sql, data, queryError, tables, isQueryLoading }: any) => {


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
          
          {tables.map((table: TableData, tidx: number) => <Dropdown key={tidx} title={table.table_name}>
            {table.column_names.map((item, idx) => {
              return (
                <DropdownOption key={idx}>
                  <div className="dropdownOption__Content">
                    <span>{item}</span>
                    {/* <ProgressBar percent={item.percent} /> */}
                  </div>
                </DropdownOption>
              );
            })}
          </Dropdown>)}

        </div>
        {/* <div className="models__container">
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
        </div> */}
      </div>

      <div className="dataset__sidebar__container center">
        <div className="code__container">
          <div className="code__container-header">
            <div className="title">
              <img src="/assets/codeIcon.svg" alt="" />
              {/* <span>Sample.SQL</span> */}
            </div>
            <ClipLoader color="purple" loading={isQueryLoading} size={25} />
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
            { data.length > 0 ?
            <h5>{data.length} Rows, {Object.keys(data[0]).length} Columns</h5>
            :<></>}
            {/* <span>No changes in row count</span> */}
          </div>
        </div>

        {/* <div className="Sources__container">
          <span>Sources Tables</span>
          <div>
            <span>insurance_database_2022_05 </span>
            <span>140,000 Rows</span>
          </div>
        </div> */}

        <div className="selectedColumns__container">
          {data.length > 0 ? 
          <Dropdown title="Query Result">
          {Object.keys(data[0]).map((item, idx) => {
              return (
                <DropdownOption key={idx}>
                  <div className="dropdownOption__Content">
                    <span>{item}</span>
                    {/* <ProgressBar percent={item.percent} /> */}
                  </div>
                </DropdownOption>
              );
            })}
          </Dropdown>
            :<></>}
        </div>

      </div>
    </div>
  );
};

export default Dataset;
