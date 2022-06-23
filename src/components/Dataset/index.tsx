import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/tauri";
import { resourceDir } from "@tauri-apps/api/path";
import ClipLoader from "react-spinners/ClipLoader";
import { Dropdown, DropdownOption } from "../common/dropdown";
import CodeEditor from "./components/editor";
// import ProgressBar from "./components/progressBar";
import Table from "./components/table";
import "./dataset.css";
import { QueryData, TableData } from "../../types";
import { useAppDispatch } from "src/hooks/hooks";
import { RefreshComponents } from "src/redux/builderSlice";
import { metadataToComponent } from "../Analysis/model/metadata";
import { FieldSchema } from "../../types";
import { arrowDataTypeToRunicElementType } from "../Analysis/utils/ArrowConvert";
import { ElementType, Tensor } from "@hotg-ai/rune";
import { sqlTableIcon } from "../../assets";
import { open } from "@tauri-apps/api/dialog";
import { downloadDir, join } from "@tauri-apps/api/path";
import { loadProcBlocks } from "./procBlocks";
import ArrowTable from "./components/arrowtable";

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

const sortByGroup = (a: QueryData | TableData, b: QueryData | TableData) => {
  const aG = a.group;
  const bG = b.group;

  if (aG > bG) {
    return 1;
  } else if (aG === bG) {
    return 0;
  } else {
    return -1;
  }
};

const Dataset = ({
  setSql,
  sql,
  data,
  querySchema,
  queryError,
  datasetRegistry,
  tables,
  isQueryLoading,
  numberSelectedDatasets,
  setQueryData,
  setQueryError,
  selectDataset,
  setIsQueryLoading,
}: {
  setSql: (sql: string) => void;
  sql: string | undefined;
  data: any[];
  querySchema: { fields: FieldSchema[] };
  queryError: string | undefined;
  tables: TableData[];
  datasetRegistry: Record<string, QueryData>;
  isQueryLoading: boolean;
  setIsQueryLoading: (isQueryLoading: boolean) => void;
  numberSelectedDatasets: number;
  setQueryData: (name: string, query_data: QueryData) => void;
  setQueryError: (error: string) => void;
  selectDataset: (dataset: string, toggle: boolean) => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const linkInputRef = useRef<any>();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const [datasetName, setDatasetName] = useState("untitled_dataset");
  const history = useNavigate();

  useEffect(() => {
    const procBlocks = async () => {
      const pb = await loadProcBlocks();
      const $RESOURCE = await resourceDir();
      const allProckBlocks: any[] = await invoke("known_proc_blocks");
      const pbs = Object.entries(pb).map(([name, procBlock]) => {
        const match = allProckBlocks.filter((p) => p["name"] === name);
        const matchUrl = match[0]["publicUrl"].replace(
          "$RESOURCE",
          `${$RESOURCE}/preload_proc_blocks`
        );
        return [
          `proc-block/${name}`,
          metadataToComponent(name, procBlock, matchUrl),
        ] as const;
      });
      await dispatch(
        RefreshComponents({
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

  const groups: Record<string, TableData[]> = {};
  tables.forEach((t) => {
    let group = "ungrouped";
    if (t.group) {
      group = t.group;
    }
    if (!groups[group]) groups[group] = [t];
    else groups[group].push(t);
  });

  return (
    <div className="dataset_page">
      <div
        className="spinner__container"
        style={{ display: isQueryLoading ? "flex" : "none" }}
      >
        <div className="spinner__body">
          <ClipLoader color="purple" size={25} />{" "}
          <p style={{ paddingLeft: "20px" }}>Loading ...</p>
        </div>
      </div>
      <div className="dataset__container">
        <div className="dataset__sidebar__container left">
          <div className="back-link__container">
            <Link to="/">
              <img src="/assets/backArrow.svg" alt="<" />
              <span>Back Home</span>
            </Link>
          </div>
          <div className="tables__container">
            <div className="tables-title__container">
              <div className="title">
                <img src="/assets/table.svg" alt="" />
                <span>Tables</span>
              </div>
              <button
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
                    setIsQueryLoading(true);
                    invoke("load_csv", { invokeMessage: file })
                      .then((res) => {
                        let result = res as string;
                        setQueryError(`${file} loaded as ${result}`);

                        history("/dataset/1", { replace: true });
                        //  this.setState({ queryError: `${files[0]} loaded as ${result}` });
                        setIsQueryLoading(false);
                      })
                      .catch((e) => {
                        setQueryError(e.message);
                        setIsQueryLoading(false);
                        history("/dataset/1", { replace: true });
                      });
                  }
                }}
              >
                Add CSV
              </button>
            </div>

            <GroupedTables groups={groups} sql={sql} setSql={setSql} />
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
                <span>
                  <input
                    className="code__container-datasetname-input"
                    type="text"
                    onChange={(c) => setDatasetName(c.target.value)}
                    value={datasetName}
                  />
                </span>
              </div>
              <ClipLoader color="purple" loading={isQueryLoading} size={25} />
              <button
                className="addAsDataset_btn"
                onClick={() => {
                  const name = datasetName;
                  try {
                    const dataset = createQueryDataset(data, querySchema, sql);
                    setQueryData(name, dataset);
                    setQueryError("Registered DataSet: " + name);
                  } catch (e) {
                    setQueryError("Cannot create dataset: \n" + e.message);
                  }
                }}
              >
                <span>Prepare for Analysis</span>
              </button>
              <button
                className="startAnalysis_btn"
                style={{
                  backgroundColor:
                    Object.keys(datasetRegistry).length === 0
                      ? "gray"
                      : "#00b594",
                }}
                disabled={Object.keys(datasetRegistry).length === 0}
                onClick={() => {
                  history("/analysis/1");
                }}
              >
                <span>Start Analysis </span>
              </button>
            </div>
            <CodeEditor setSql={(v) => setSql(v)} sql={sql} />
          </div>
        </div>

        <div className="dataset__sidebar__container right">
          {/* <div className="Sources__container">
          <span>Sources Tables</span>
          <div>
            <span>insurance_database_2022_05 </span>
            <span>140,000 Rows</span>
          </div>
        </div> */}

          <div className="selectedColumns__container">
            {Object.keys(datasetRegistry).map((name: string, iddx: number) => {
              const dataset = datasetRegistry[name];
              return (
                <div
                  className={datasetName === name ? "activeDataset" : undefined}
                  key={`DropdownOption-${name}-${iddx}`}
                //  onClick={() => selectDataset(name, !dataset.selected)}
                >
                  <div key={name} className="dropdownOption__Content">
                    <div className="title-content">
                      <h3
                        onClick={() => {
                          setSql(dataset.query);
                          setDatasetName(name);
                        }}
                      >
                        {name}
                      </h3>
                    </div>
                    <span
                      onClick={() => {
                        setSql(dataset.query);
                        setDatasetName(name);
                      }}
                    >
                      {dataset.query}
                    </span>
                    {data && data.length > 0 && datasetName === name && (
                      <Dropdown title="Query Result Schema">
                        {querySchema.fields.map(
                          (field: FieldSchema, idx: number) => {
                            return (
                              <DropdownOption key={idx}>
                                <div className="dropdownOption__Content">
                                  <span>
                                    {field.name}:{" "}
                                    {typeof field.data_type === "string"
                                      ? field.data_type
                                      : Object.keys(field.data_type)[0]}
                                  </span>
                                  {/* <span>{JSON.stringify(field)}</span> */}
                                  {/* <ProgressBar percent={item.percent} /> */}
                                </div>
                              </DropdownOption>
                            );
                          }
                        )}
                      </Dropdown>
                    )}
                    {/* <span>{JSON.stringify(field)}</span> */}
                    {/* <ProgressBar percent={item.percent} /> */}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="dataset__sidebar__container footer">
            {data && data.length > 0 && (
              <>
                <h5>
                  {data.length} Rows, {Object.keys(data[0].toJSON()).length}{" "}
                  Columns
                </h5>
                <div
                  className="saveBtn"
                  onClick={async () => {
                    let fileLoc = (await open({
                      title: "Select a location to save CSV file",
                      directory: true,
                      multiple: false,
                      defaultPath: await downloadDir(),
                    })) as string;
                    if (typeof fileLoc === "string") {
                      // append data name
                      fileLoc = await join(fileLoc, `${datasetName}.csv`);

                      invoke("save_data", { sql, fileLoc })
                        .then((rows) => {
                          setQueryError(`Saved ${rows} to ${fileLoc}`);
                        })
                        .catch((e) => {
                          setQueryError("Error saving file: " + e);
                        });
                    }
                  }}
                >
                  Export
                </div>
              </>
            )}
            {/* <span>No changes in row count</span> */}
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
          <pre>{queryError}</pre>
        ) : data.length > 0 ? (
          <ArrowTable data={data} />
        ) : (
          <span className="message">No data</span>
        )}
      </div>
    </div>
  );
};

export default Dataset;

type QuerySchema = { fields: FieldSchema[] };

/**
 * Given the result of a query, try to merge it into a 2D tensor.
 *
 * @param data The records returned from DuckDB
 * @param querySchema The schema for the data parameter
 * @param query The SQL query that was executed
 * @returns
 */
function createQueryDataset(
  data: Array<Record<string, any>>,
  querySchema: QuerySchema,
  query: string
): QueryData {
  

      const dataType = commonDataType(querySchema);


      const tensor = mergeColumnsIntoTensor(
        data,
        querySchema.fields.map((f) => f.name),
        dataType
      );
      if (!tensor) {
        // The data couldn't be merged (because it was a string, etc.).
        throw new Error("Could not merge data");
      }

      return {
        fields: querySchema.fields,
        query,
        tensor,
        selected: true,
        data,
        createdAt: new Date(),
      };

}

/**
 * Try to find the common element type
 * @param schema
 * @returns
 */
function commonDataType(schema: QuerySchema): ElementType {
  const [first, ...rest] = schema.fields;

  rest.some((field) => {
    let fail = `${field.data_type}` !== `${first.data_type}`;
    if (fail) {
      throw new Error(`Field: '${field.name}'(${field.data_type}) and isn't the same data type as '${first.name}'(${first.data_type})\n
Analysis features must be common datatype.
i.e. all columns must be of the same type: DOUBLE, INT etc. \n Consider using cast \`::double\` or \`(column as DOUBLE)\``)
    }
    return fail
  });

  return arrowDataTypeToRunicElementType(first.data_type);
}

interface TypedArray extends ArrayBuffer {
  [index: number]: number | bigint;
}

interface TypedArrayConstructor {
  new(length: number): TypedArray;
}

function mergeColumnsIntoTensor(
  data: Array<Record<string, any>>,
  columnNames: string[],
  elementType: ElementType
): Tensor | undefined {
  const dimensions = Uint32Array.from(
    [data.length, columnNames.length].filter((d) => d !== 1)
  );
  const elements: number[] = [];

  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < columnNames.length; j++) {
      const element = data[i][columnNames[j]];
      if (typeof element !== "number") {
        throw new Error();
      }
      elements.push(element);
    }
  }

  switch (elementType) {
    case ElementType.U8:
      return { elementType, dimensions, buffer: Uint8Array.from(elements) };
    case ElementType.I8:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Int8Array.from(elements).buffer),
      };
    case ElementType.U16:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Uint16Array.from(elements).buffer),
      };
    case ElementType.I16:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Int16Array.from(elements).buffer),
      };
    case ElementType.U32:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Uint32Array.from(elements).buffer),
      };
    case ElementType.I32:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Int32Array.from(elements).buffer),
      };
    case ElementType.F32:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Float32Array.from(elements).buffer),
      };
    case ElementType.U64:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(
          BigUint64Array.from(elements.map(BigInt)).buffer
        ),
      };
    case ElementType.I64:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(BigInt64Array.from(elements.map(BigInt)).buffer),
      };
    case ElementType.F64:
      return {
        elementType,
        dimensions,
        buffer: new Uint8Array(Float64Array.from(elements).buffer),
      };

    default:
      return undefined;
  }
}

const GroupedTables = ({
  groups,
  sql,
  setSql,
}: {
  groups: Record<string, TableData[]>;
  sql: string;
  setSql: (sql: string) => void;
}) => {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  return (
    <div>
      {Object.keys(groups).map((groupName) => {
        const tables = groups[groupName];
        const hide = hidden[groupName];
        const setHide = (toggle) =>
          setHidden({ ...hidden, [groupName]: toggle });

        return (
          <div key={`table-${groupName}`}>
            <hr />
            <span
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
              onClick={() => {
                setHide(!hide);
              }}
            >
              <h3>
                <b>{groupName}</b>
              </h3>{" "}
              <img
                src={`/assets/dropdown${!hide ? "open" : "Close"}.svg`}
                alt=""
              />{" "}
            </span>
            <div style={{ display: hide ? "none" : "block" }}>
              <GroupedTableInner tables={tables} sql={sql} setSql={setSql} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GroupedTableInner = ({
  tables,
  setSql,
  sql,
}: {
  tables: TableData[];
  sql: string;
  setSql: (sql: string) => void;
}) => {
  return (
    <>
      {tables
        .sort((a, b) => sortByGroup(a, b))
        .map((table: TableData, tidx: number) => (
          <Dropdown
            key={`Dropdown-${tidx}`}
            title={table.table_name}
            selectBtnIcon={sqlTableIcon}
            onSelect={() => {
              setSql(
                `${sql ? sql + "\n" : ""} select * from ${table.table_name
                } limit 10`
              );
            }}
          >
            {table.column_names.map((item, idx) => {
              return (
                <DropdownOption key={`DropdownOption-${tidx}-${idx}`}>
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
    </>
  );
};
