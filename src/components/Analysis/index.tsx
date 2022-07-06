import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SerializedFlowDiagram } from "src/canvas2rune/serialized";
import { useAppSelector } from "src/hooks/hooks";
import { FlowElements } from "src/redux/reactFlowSlice";
import Modal from "../Dataset/components/modal";
import "./analysis.css";
import InputDimensions from "./InputDimensions";
import OutputDimensions from "./OutputDimensions";
import Properties from "./Properties";
import StudioCanvas from "./StudioCanvas";
import { ComponentsSelector } from "./StudioComponentsSelector";

import { FlowNodeData } from "./model/FlowNodeComponent";
import { Node } from "react-flow-renderer";
import { TensorDescriptionModel } from "./model";
import ClipLoader from "react-spinners/ClipLoader";
import { QueryData } from "../../types";
import { convertElementType } from "./model/metadata";
import { Carousel, Tabs } from "antd";
import {
  image6,
  introModalStepOne,
  studioCanvasScreenshot,
  testDatasetScreenshot,
} from "src/assets";
import { generateNodeKey, sanitizeName, storm2rune } from "src/canvas2rune";
import { diagramToRuneCanvas } from "./utils/FlowUtils";
import { Console } from "console-feed";
import React from "react";
import ArrowTable, {
  computeColumns,
  VTable,
} from "../Dataset/components/arrowtable";

function Analysis({
  data,
  querySchema,
  datasetRegistry,
  setQueryError,
  queryError,
  setIsLoadingTable,
  isLoadingTable,
  setLogs,
  logs,
}: {
  data: any[];
  querySchema: any;
  datasetRegistry: Record<string, QueryData>;
  setQueryError: (error: string | undefined) => void;
  queryError: string | undefined;
  setIsLoadingTable: (isLoading: boolean) => void;
  isLoadingTable: boolean;
  setLogs: (error: any) => void;
  logs: any[];
}) {
  const diagram = useAppSelector((s) => s.flow);
  const components = useAppSelector((s) => s.builder.components);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [introModalVisible, setIntroModalVisible] = useState(false);
  const [activeCollapseKeys, setActiveCollapseKeys] = useState([
    "Data Columns",
  ]);
  const [tableData, setTableData] = useState([]);
  const [activeKey, setActiveKey] = React.useState("1");
  const onKeyChange = (key) => setActiveKey(key);

  const selectedNodeId = useAppSelector((s) => s.builder.selected);

  const [resultData, setResultData] = useState<undefined | any[]>(undefined);
  const [nodeHasContextualData, setNodeHasData] = useState<boolean>(false);
  const [contextualDatasetName, setDatasetName] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    setDatasetName(undefined);
    setNodeHasData(false);
    if (selectedNodeId && selectedNodeId !== undefined) {
      try {
        const selectedNode = diagram.nodes.filter(
          (node) => node.id === selectedNodeId.id
        )[0];
        if (
          selectedNode &&
          selectedNode.type === "capability" &&
          datasetRegistry
        ) {
          const datasetName = selectedNode.data.name.replace("Dataset_", "");
          if (datasetRegistry[datasetName]) {
            setDatasetName(datasetName);
            setNodeHasData(true);
          }
        }
      } catch (e) {
        console.error("SELECTED NODE DOES NOT EXIST");
      }
    }
  }, [selectedNodeId]);

  useEffect(() => {
    if (resultData && resultData !== undefined && resultData[0] !== undefined)
      setActiveKey("3");
  }, [resultData]);

  useEffect(() => {
    if (sessionStorage.getItem("analysis_intro") !== "seen") {
      setIntroModalVisible(true);
      sessionStorage.setItem("analysis_intro", "seen");
    }
  }, []);

  const { id } = useParams();

  const buildAndRun = async (
    diagram: FlowElements,
    data: any[]
  ): Promise<string> => {
    const rune = await storm2rune(
      JSON.parse(
        JSON.stringify(
          diagramToRuneCanvas(
            {
              state: "loaded",
              info: {
                id: "",
                name: "",
                ownerId: 0,
                path: "",
                templateName: "",
                url: "",
              },
              procBlocks: {},
            },
            {},
            components,
            diagram
          )
        )
      ) as SerializedFlowDiagram
    );

    const getDataArrayFromType = (data, type) => {
      switch (type) {
        case "utf8":
          return data;
        case "u8":
          return Uint8Array.from(data);
        case "u16":
          return Uint32Array.from(data);
        case "u32":
          return Uint32Array.from(data);
        case "u64":
          return BigUint64Array.from(data);
        case "i8":
          return Int8Array.from(data);
        case "i16":
          return Int16Array.from(data);
        case "i32":
          return Int32Array.from(data);
        case "i64":
          return BigInt64Array.from(data);
        case "f32":
          return Float32Array.from(data);
        case "f64":
          return Float64Array.from(data);
      }
    };

    const convertTensorResult = (output: {
      element_type: string;
      dimensions: number[];
      buffer: any;
    }) => {
      const { element_type, buffer } = output;
      const data = new Uint8Array(buffer);
      switch (element_type.toLowerCase()) {
        case "utf8":
          return data;
        case "u8":
          return new Uint8Array(data.buffer);
        case "u16":
          return new Uint16Array(data.buffer);
        case "u32":
          return new Uint32Array(data.buffer);
        case "u64":
          return new BigUint64Array(data.buffer);
        case "i8":
          return new Int8Array(data.buffer);
        case "i16":
          return new Int16Array(data.buffer);
        case "i32":
          return new Int32Array(data.buffer);
        case "i64":
          return new BigInt64Array(data.buffer);
        case "f32":
          return new Float32Array(data.buffer);
        case "f64":
          return new Float64Array(data.buffer);
      }
    };

    //todo: Need to change this for 3D data
    const transformByDimensions = (dimensions, data) => {
      const cols = dimensions[1] || 1;
      const rows = dimensions[0] || 0;

      let start = 0;
      let result = [];

      for (let i = 0; i < rows; i++) {
        result.push(data.slice(start, start + cols).join(", "));

        start += cols;
      }

      return result;
    };

    const getConnectedInputTensor = (
      capability: Node<FlowNodeData>,
      diagram: FlowElements
    ): TensorDescriptionModel | undefined => {
      if (!data || data.length < 1) return undefined;
      if (!data || data.length === 0) return undefined;
      const connectedEdge = diagram.edges.filter(
        (edge) => edge.source === capability.id
      );

      if (connectedEdge.length > 0) {
        const connectedNode = diagram.nodes.filter(
          (node) => node.id === connectedEdge[0].target
        );
        if (connectedNode.length > 0) {
          return connectedNode[0].data.inputs.filter(
            (input) => input.id === connectedEdge[0].targetHandle
          )[0].tensor;
        }
      }
      return undefined;
    };

    //TODO: Move to backend
    let columns = [];
    if (data[0]) columns = Object.keys(data[0]);
    let dataMap = {};
    data.forEach((row) => {
      columns.forEach((column) => {
        if (dataMap[column]) dataMap[column].push(row[column]);
        else dataMap[column] = [row[column]];
      });
    });

    let input_tensors = {};

    const capabilities = diagram.nodes.filter(
      (node) => node.data.type === "capability"
    );

    capabilities.forEach((node) => {
      if (node.data.name.startsWith("Dataset_")) {
        const name = node.data.name.replace("Dataset_", "");
        input_tensors[
          sanitizeName(
            generateNodeKey({
              ...node,
              name: "",
              componentIdentifier: "",
              type: "capability",
            })
          )
        ] = {
          element_type: convertElementType(
            datasetRegistry[name].tensor.elementType
          ).toUpperCase(),
          dimensions: Object.values(datasetRegistry[name].tensor.dimensions),
          buffer: Object.values(datasetRegistry[name].tensor.buffer),
        };
      } else {
        // const descriptor = getConnectedInputTensor(node, diagram);
        // const data = getDataArrayFromType(
        //   dataMap[node.data.label],
        //   descriptor.elementType
        // );
        // const { buffer, byteLength } = data;
        // const bufferAsU8 = new Uint8Array(buffer, 0, byteLength);
        // tensor = {
        //   buffer,
        //   elementType: modelToTensorElementType(descriptor.elementType),
        //   dimensions: Uint32Array.from(descriptor.dimensions),
        // };
        // input_tensors[node.data.label] = {
        //   element_type: descriptor.elementType.toUpperCase(),
        //   dimensions: [data.length],
        //   buffer: Object.values(bufferAsU8),
        // };
      }
    });
    let result;
    let resultTable = [];
    setResultData([]);
    try {
      console.log("Runefile", rune);
      const zune = await invoke("compile", { runefile: rune });
      console.log("ZUNE BUILT");
      try {
        result = await invoke("reune", {
          zune: zune,
          inputTensors: input_tensors,
        });
        Object.entries(result).forEach(([rkey, value]: [string, any]) => {
          const keys = rkey.split("_");
          let key: string = rkey;
          if (keys && keys.length && keys.length > 1) key = keys[1];
          if (keys[1] === "block" && keys[0] === "proc" && keys.length > 2)
            key = keys[2];
          const resultSet = result[rkey];
          const tensorResult = convertTensorResult(resultSet);
          const Result = transformByDimensions(
            resultSet.dimensions,
            tensorResult
          );
          Result.forEach((row, index) => {
            let tup = {};
            tup[key] = Result[index] !== undefined ? Result[index] : "";
            if (resultTable[index])
              resultTable[index][key] =
                Result[index] !== undefined ? Result[index] : "";
            else resultTable[index] = tup;
          });
        });
        setResultData(resultTable);
        setLogs(
          "Run Succeeded. Got result with row count: " + resultTable.length
        );
      } catch (error) {
        console.log("RUN ERROR", error, result);
        setLogs(error.backtrace);
      }
    } catch (error) {
      console.log("COMPILE ERROR", error);
      setLogs(error.backtrace);
    }
    return result;
  };

  const fileInput = document.querySelector(".input-file") as HTMLInputElement,
    the_return = document.querySelector(".file-return")!;

  const toggleActiveCollapseKeys = (key: string) => {
    const activeCollapseKeysVar = [...activeCollapseKeys];
    const keyIndex = activeCollapseKeysVar.indexOf(key);

    if (keyIndex === -1) {
      activeCollapseKeysVar.push(key);
    } else {
      activeCollapseKeysVar.splice(keyIndex, 1);
    }

    setActiveCollapseKeys(activeCollapseKeysVar);
  };

  return (
    <div className="analysis_page">
      <div className="sidebar_left">
        <div className="back-link__container">
          <Link to={`/`}>
            <img src="/assets/backArrow.svg" alt="<" />
            <span>Back</span>
          </Link>
        </div>
        <Link to={`/dataset/${id}`}>Add Dataset</Link>
        <ComponentsSelector
          datasetRegistry={datasetRegistry}
          querySchema={querySchema}
        />
      </div>

      <div className="analysis_page_content">
        <div className="studio__container">
          <div className="studio__content">
            <StudioCanvas datasetRegistry={datasetRegistry} />
          </div>
          <div className="sidebar_right">
            <button
              onClick={async () => {
                setQueryError(undefined);
                setIsLoadingTable(true);
                setActiveKey("2");

                buildAndRun(diagram, tableData)
                  .then((result) => {
                    setIsLoadingTable(false);
                  })
                  .catch((e) => {
                    setQueryError("Error running model");
                    setIsLoadingTable(false);
                    console.error(e);
                  });
              }}
            >
              {/* <img src="/assets/model.svg" alt="<" /> */}
              {isLoadingTable ? (
                <ClipLoader color="purple" loading={isLoadingTable} size={25} />
              ) : (
                <span>{"</> "}Build &amp; Run</span>
              )}
            </button>
            <button style={{visibility: "hidden"}} onClick={() => setCustomModalVisible(true)}>
              {/* <img src="/assets/share.svg" alt="<" /> */}
              <span>Save and Share</span>
            </button>
            {queryError ? <span>{queryError}</span> : <></>}
            <div className="properties__container">
              <div className="title">
                <img src="/assets/properties.svg" alt="" />
                <span>Properties</span>
              </div>
              <InputDimensions />
              <Properties />
              <OutputDimensions />
            </div>
          </div>
        </div>
        <div className="studio-table__container">
          <Tabs
            defaultActiveKey="1"
            activeKey={activeKey}
            onChange={onKeyChange}
          >
            {nodeHasContextualData && nodeHasContextualData !== undefined && (
              <Tabs.TabPane tab="Data" key="1" className="data-table-tab">
                {contextualDatasetName && (
                  <ArrowTable
                    data={datasetRegistry[contextualDatasetName].data}
                  />
                )}
              </Tabs.TabPane>
            )}
            <Tabs.TabPane
              tab={
                <>
                  Logs <span className="count">{logs.length}</span>
                </>
              }
              key="2"
            >
              <Console logs={logs} variant="light" />
            </Tabs.TabPane>
            {resultData &&
              resultData !== undefined &&
              resultData[0] !== undefined && (
                <Tabs.TabPane
                  tab={
                    <>
                      Output <span className="count">{resultData.length}</span>
                    </>
                  }
                  key="3"
                  className="data-table-tab"
                >
                  <VTable
                    columns={computeColumns(Object.keys(resultData[0]))}
                    data={resultData}
                  />
                </Tabs.TabPane>
              )}
          </Tabs>
        </div>
      </div>

      {customModalVisible && (
        <Modal
          className="analysis_modal__container"
          title="Save and Share Dataset / Schema"
          setModalVisible={setCustomModalVisible}
        >
          <form action="">
            <div className="modal-body-content">
              <h4>What do you want to be saved?</h4>

              <div>
                <div className="btn-switch">
                  <p>Dataset</p>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="btn-switch">
                  <p>Schemas</p>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="btn-switch">
                  <p>SQL Codes and Tables</p>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="btn-switch">
                  <p>Weld Analysis</p>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <button className="btn-purple-round">Save as .Weld</button>
            </div>

            <div className="modal-footer">
              <h4>Share via Email:</h4>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Email Address"
              />

              <button className="btn-purpleOutline-round">Share</button>
            </div>
          </form>
        </Modal>
      )}

      {saveModalVisible && (
        <Modal
          className="save_modal__container"
          title="Add Custom Model"
          setModalVisible={setSaveModalVisible}
        >
          <form action="">
            <div className="modal-body-content">
              <div className="modal-body_title">
                <h4>Drag and drop your files / Upload</h4>
                <p>File type: .SQL</p>
              </div>

              <div>
                <div className="input-file-container dragFile">
                  <input className="input-file" id="my-file" type="file" />
                  <label
                    tabIndex={0}
                    htmlFor="my-file"
                    className="input-file-trigger"
                    onKeyDown={function (event: any) {
                      if (event.keyCode === 13 || event.keyCode === 32) {
                        fileInput.focus();
                      }
                    }}
                    onClick={function (event: any) {
                      fileInput.focus();
                      return false;
                    }}
                    onChange={function (event: any) {
                      the_return.innerHTML = event.target.value;
                    }}
                  >
                    <img src="/assets/upload.svg" alt="" />
                    <p>Drop Your Files Here</p>
                  </label>
                  <p className="file-return"></p>
                </div>

                <div className="input-file-container selectFile">
                  <input className="input-file" id="my-file" type="file" />
                  <label
                    tabIndex={0}
                    htmlFor="my-file"
                    className="input-file-trigger"
                  >
                    <p>Select File</p>
                  </label>
                  <p className="file-return"></p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-footer_btns">
                <div
                  className="btn-outline"
                  onClick={() => setSaveModalVisible(false)}
                >
                  Cancel
                </div>
                <div className="btn-green-round">Add Model</div>
              </div>
            </div>
          </form>
        </Modal>
      )}

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

export default Analysis;
