import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownOption } from "./components/dropdown";
import CodeEditor from "./components/editor";
// import ProgressBar from "./components/progressBar";
import Table from "./components/table";
import "./dataset.css";
import { TableData } from "../../types";
import Modal from "./components/modal";

const Dataset = ({ setSql, sql, data, queryError, tables }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const linkInputRef = useRef<any>();

  const copyLinkToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("The link has been copied successfully: " + text);
      })
      .catch(() => {
        alert("something went wrong, Please copy the link again!");
      });
  };

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

          {tables.map((table: TableData, tidx: number) => (
            <Dropdown key={tidx} title={table.table_name}>
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
            </Dropdown>
          ))}
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
            {/* <button>Run SQL</button> */}
          </div>
          <CodeEditor setSql={(v) => setSql(v)} sql={sql} />
        </div>
        {queryError ? (
          <div className="table_container">{queryError}</div>
        ) : data.length > 0 ? (
          <div className="table__container">
            <Table data={data} />
          </div>
        ) : (
          <div className="table_container">No data</div>
        )}
      </div>

      <div className="dataset__sidebar__container right">
        <div className="share__container">
          <button onClick={() => setModalVisible(true)}>
            <img src="/assets/share.svg" alt="" />
            <span>Share</span>
          </button>
          <div>
            {data.length > 0 ? (
              <h5>
                {data.length} Rows, {Object.keys(data[0]).length} Columns
              </h5>
            ) : (
              <></>
            )}
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
          {data.length > 0 ? (
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
          ) : (
            <></>
          )}
        </div>
      </div>

      {modalVisible && (
        <Modal
          className="share_modal__container"
          title="download Rune"
          setModalVisible={setModalVisible}
        >
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius,
            repellat! Hic maxime distinctio reprehenderit amet veritatis
            voluptate magni voluptatum consequatur!
          </p>
          <div className="link__container">
            <input
              type="text"
              value="This is the link"
              id="LinkInput"
              ref={linkInputRef}
            />
            <button
              onClick={() => {
                var copyText = linkInputRef.current as HTMLInputElement;

                copyText.select();
                copyText.setSelectionRange(0, 99999);
                copyLinkToClipboard(copyText.value);
              }}
            >
              <span>Copy the Link </span>
              <img src="/assets/copy.svg" alt="" />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dataset;
