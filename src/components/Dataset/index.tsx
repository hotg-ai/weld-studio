import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import ClipLoader from "react-spinners/ClipLoader";
import { Dropdown, DropdownOption } from "../common/dropdown";
import CodeEditor from "./components/editor";
// import ProgressBar from "./components/progressBar";
import Table from "./components/table";
import "./dataset.css";
import { TableData } from "../../types";
import { useAppDispatch } from "src/hooks/hooks";
import { loadProcBlocks } from "src/redux/actions/project/loadProject";
import { UpdateComponents } from "src/redux/builderSlice";
import { metadataToComponent } from "../Analysis/model/metadata";
import _ from "lodash";
import { FieldSchema } from "../../types";
type IntegerColumnType = {
  type: "INTEGER";
  value: Uint16Array;
};

type DoubleColumnType = {
  type: "DOUBLE";
  value: Float32Array;
};

type VarcharColumnType = {
  type: "VARCHAR";
  value: string[];
};

type TableColumnType = IntegerColumnType | DoubleColumnType | VarcharColumnType;
type TableColumnTypes = Record<string, TableColumnType>;
export type DatasetTypes = Record<string, TableColumnTypes>;

const Dataset = ({
  setSql,
  sql,
  data,
  querySchema,
  queryError,
  tables,
  isQueryLoading,
}: {
  setSql: (sql: string) => void;
  sql: string | undefined;
  data: any[];
  querySchema: { fields: FieldSchema[] };
  queryError: string | undefined;
  tables: TableData[];
  isQueryLoading: boolean;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const linkInputRef = useRef<any>();
  const { id } = useParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const procBlocks = async () => {
      const pb = await loadProcBlocks();
      const allProckBlocks: any[] = await invoke("known_proc_blocks");
      const pbs = Object.entries(pb).map(([name, procBlock]) => {
        const match = allProckBlocks.filter((p) => p["name"] === name);
        const matchUrl = match[0]["publicUrl"];
        return [
          `proc-block/${name}`,
          metadataToComponent(name, procBlock, matchUrl),
        ] as const;
      });
      await dispatch(
        UpdateComponents({
          ...Object.fromEntries(pbs),
        })
      );
    };
    procBlocks().catch(console.error);
  }, []);

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
  let dataTypes: DatasetTypes = {};

  tables.map((table: TableData, tidx: number) => {
    if (!dataTypes[table.table_name]) dataTypes[table.table_name] = {};
    table.column_names.map((item, idx) => {
      if (!dataTypes[table.table_name][item]) {
        if (table.column_types[idx] === "INTEGER")
          dataTypes[table.table_name][item] = {
            type: "INTEGER",
            value: new Uint16Array(),
          };
        if (table.column_types[idx] === "DOUBLE")
          dataTypes[table.table_name][item] = {
            type: "DOUBLE",
            value: new Float32Array(),
          };
        if (table.column_types[idx] === "VARCHAR")
          dataTypes[table.table_name][item] = {
            type: "VARCHAR",
            value: [""],
          };
      }
    });
  });

  return (
    <div className="dataset_page">
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
                        <span>
                          {item}: {table.column_types[idx]}
                        </span>
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
              <ClipLoader color="purple" loading={isQueryLoading} size={25} />
            </div>
            <CodeEditor setSql={(v) => setSql(v)} sql={sql} />
          </div>
        </div>

        <div className="dataset__sidebar__container right">
          <div className="share__container">
            {/* <button onClick={() => setModalVisible(true)}>
              <img src="/assets/share.svg" alt="" />
              <span>Share</span>
            </button> */}
            <Link
              to={{ pathname: `/analysis/${id}` }}
              state={{
                dataColumns:
                  data && data.length > 0 ? Object.keys(data[0]) : {},
                data: data || [],
                dataTypes: dataTypes || {},
              }}
            >
              <button>
                <span> Add Analysis</span>
              </button>
              <button>
                <span> Add as Dataset</span>
              </button>
            </Link>
            <div>
              {data && data.length > 0 ? (
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
            {data && data.length > 0 ? (
              <Dropdown title="Query Result">
                {querySchema.fields.map((field: FieldSchema, idx: number) => {
                 
                  return (
                    <DropdownOption key={idx}>
                      <div className="dropdownOption__Content">
                        <span>{field.name}: {typeof field.data_type == "string" ? field.data_type : Object.keys(field.data_type)[0]}</span>
                        {/* <span>{JSON.stringify(field)}</span> */}
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

        {/* {modalVisible && (
          <Modal
            className="share_modal__container"
            title="download Rune"
            setModalVisible={setModalVisible}
          >
            <p>
              You can download the entire package and share it with anyone as a
              file or link. They can download the DeFrag app and import it to
              run the same analytics you have created.
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
        )} */}
      </div>
      <div className="table__container">
        {queryError ? (
          <span className="error">{queryError}</span>
        ) : data.length > 0 ? (
          <Table data={data} />
        ) : (
          <span className="message">No data</span>
        )}
      </div>
    </div>
  );
};

export default Dataset;
