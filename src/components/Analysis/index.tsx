import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SerializedFlowDiagram } from "src/canvas2rune/serialized";
import { useAppDispatch, useAppSelector } from "src/hooks/hooks";
import { FlowElements } from "src/redux/reactFlowSlice";
import Modal from "../Dataset/components/modal";
import Table from "../Dataset/components/table";
import "./analysis.css";
import InputDimensions from "./InputDimensions";
import OutputDimensions from "./OutputDimensions";
import Properties from "./Properties";
import StudioCanvas, {
  defaultPropertyValues,
  inputs,
  outputs,
} from "./StudioCanvas";
import { ComponentsSelector } from "./StudioComponentsSelector";
import { v4 as uuid } from "uuid";

import { FlowNodeData } from "./model/FlowNodeComponent";
import { Node, Position } from "react-flow-renderer";
import { Component, TensorDescriptionModel } from "./model";
import _ from "lodash";
import ClipLoader from "react-spinners/ClipLoader";
import { QueryData } from "../../types";
import { Tensor } from "@hotg-ai/rune";
import { convertElementType, modelToTensorElementType } from "./model/metadata";
import { Carousel, Checkbox, Input, Menu, Popover, Tabs } from "antd";
import {
  image6,
  introModalStepOne,
  studioCanvasScreenshot,
  testDatasetScreenshot,
  WebWhite,
} from "src/assets";
import { storm2rune } from "src/canvas2rune";
import { diagramToRuneCanvas } from "./utils/FlowUtils";
import { Console } from "console-feed";
import React from "react";
import ArrowTable, {
  computeColumns,
  VTable,
} from "../Dataset/components/arrowtable";
import libraryIcon from "./icons/LibraryIcon.svg";
import {
  InfoCircleFilled,
  QuestionCircleFilled,
  SearchOutlined,
} from "@ant-design/icons";

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
  const [canvasNodes, setCanvasNodes] = useState<Node<FlowNodeData>[]>([]);
  const dispatch = useAppDispatch();

  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [introModalVisible, setIntroModalVisible] = useState(false);
  const [reactFlowModal, setReactFlowModal] = useState(false);
  const [reactFlowModalTab, setReactFlowModalTab] = useState<string>("");
  const [reactFlowModalsearchedValue, setReactFlowModalsearchedValue] =
    useState<string>("");

  const reactFlowModalCurrentTab = Object.entries(components).filter(
    (component) => {
      return component[1].type === reactFlowModalTab;
    }
  );

  const reactFlowModalSearchResult =
    reactFlowModalsearchedValue &&
    Object.entries(components).filter((component) => {
      return component[1].displayName
        .toLowerCase()
        .includes(reactFlowModalsearchedValue.toLowerCase());
    });

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
    // setResultData(undefined);
    // let newTable = [];
    // console.log("DATA", data, datasetRegistry);
    // const capabilities = diagram.nodes.filter(
    //   (node) => node.data.type === "capability"
    // );
    // let labels: string[] = capabilities.map((cap) => cap.data.name);
    // newTable = data.map((o, index) => {
    //   console.log("ROW", o.toJSON());
    //   if (labels && labels.length > 0) {
    //     let row = labels.reduce((acc, curr) => {
    //       if (curr.startsWith("Dataset_")) {
    //         const name = curr.replace("Dataset_", "");
    //         try {
    //           Object.entries(datasetRegistry[name].data[index]).forEach(
    //             ([k, v]) => {
    //               if (!acc[name]) acc[name] = "";
    //               acc[name] = acc[name] + `"${k}": ${v}, `;
    //               if (resultData && resultData[index] !== null) {
    //                 acc["Result"] = resultData[index];
    //               }
    //             }
    //           );
    //         } catch (e) {}
    //       } else {
    //         acc[curr] = o.toJSON()[curr];
    //       }
    //       return acc;
    //     }, {});
    //     if (!_.isEmpty(row)) return row;
    //   }
    // });
    // setTableData(newTable);
  }, [diagram]);

  useEffect(() => {
    if (resultData && resultData !== undefined && resultData[0] !== undefined)
      setActiveKey("3");
    let d = tableData;
    if (resultData && resultData?.length > 0) {
      d.forEach((v, i) => {
        d[i]["Result"] = resultData[i];
      });
    } else {
      d.forEach((v, i) => {
        if (d[i] && d[i]["Result"]) delete d[i]["Result"];
      });
    }
    setTableData(d);
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
      const { element_type, dimensions, buffer } = output;
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
    data.map((row) => {
      columns.map((column) => {
        if (dataMap[column]) dataMap[column].push(row[column]);
        else dataMap[column] = [row[column]];
      });
    });

    let input_tensors = {};

    const capabilities = diagram.nodes.filter(
      (node) => node.data.type === "capability"
    );

    capabilities.forEach((node) => {
      let tensor: Tensor;
      if (node.data.name.startsWith("Dataset_")) {
        const name = node.data.name.replace("Dataset_", "");
        input_tensors[node.data.label] = {
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
        const tensorResult = convertTensorResult(result);

        const Result = transformByDimensions(result.dimensions, tensorResult);
        Result.forEach((row, index) => {
          resultTable.push({
            Result: Result[index] !== undefined ? Result[index] : "",
          });
        });
        setResultData(resultTable);
        setLogs(
          "Run Succeeded. Got result with row count: " + resultTable.length
        );
      } catch (error) {
        console.log("RUN ERROR", error);
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

  console.log(logs);
  return (
    <div className="analysis_page">
      {/* <div className="sidebar_left">
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
      </div> */}

      <div className="analysis_page_content">
        <div className="studio__container">
          <div className="studio__content">
            <button
              className="addBlocks-btn"
              onClick={() => setReactFlowModal(true)}
            >
              + Add Blocks
            </button>
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
            <button onClick={() => setCustomModalVisible(true)}>
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
            <Tabs.TabPane tab="Data" key="1" className="data-table-tab">
              <Table data={tableData} />
            </Tabs.TabPane>
          </Tabs>
          <div className="logs__container">
            <div className="logs-title">
              <span>Logs</span>
              <sup>{logs.length}</sup>
            </div>
            <div className="logs-body">
              <Console logs={logs} variant="light" />
            </div>
          </div>
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
      {reactFlowModal && (
        <Modal
          className="react-flow_modal__container"
          title="Datasets"
          setModalVisible={setReactFlowModal}
          sidebar={
            <ReactFlowModalSidebar
              components={components}
              setReactFlowModalTab={setReactFlowModalTab}
              setReactFlowModalsearchedValue={setReactFlowModalsearchedValue}
              datasetId={id}
            />
          }
        >
          <div className="node-cards__container">
            {reactFlowModalSearchResult && reactFlowModalSearchResult.length > 0
              ? reactFlowModalSearchResult.map(
                  ([id, component]: [string, Component]) => (
                    <NodeCard
                      node={component}
                      id={id}
                      key={id}
                      components={components}
                      setCanvasNodes={setCanvasNodes}
                      canvasNodes={canvasNodes}
                    />
                  )
                )
              : reactFlowModalCurrentTab &&
                reactFlowModalCurrentTab.length > 0 &&
                reactFlowModalCurrentTab.map(
                  ([id, component]: [string, Component]) => (
                    <NodeCard
                      node={component}
                      id={id}
                      key={id}
                      components={components}
                      setCanvasNodes={setCanvasNodes}
                      canvasNodes={canvasNodes}
                    />
                  )
                )}
          </div>
          <div className="reactFlowModal-btns">
            <button
              onClick={() => {
                setReactFlowModal(false);
                setCanvasNodes([]);
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              className="select-btn"
              onClick={() => {
                canvasNodes.map((data) => {
                  dispatch({ type: "ADD_NODE", payload: data });
                });
                setReactFlowModal(false);
              }}
            >
              Select
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Analysis;

const ReactFlowModalSidebar = ({
  components,
  setReactFlowModalTab,
  setReactFlowModalsearchedValue,
  datasetId,
}: any) => {
  const getComponentTypes = (components: [string, Component][]): string[] => {
    return components
      .reduce((acc: string[], [_, component]) => {
        if (acc.indexOf(component.type) === -1) acc.push(component.type);
        return acc;
      }, [])
      .filter((type) => type !== "model")
      .map((type) => (type === "capability" ? "input" : type)); // NOTICE: this replaces capability with input in the collapse headers list. OMG!
  };

  const [states, setStates] = useState<{
    componentTypeKeys: string[];
    activeCollapseKeys: string[];
  }>({
    componentTypeKeys: [] as string[],
    activeCollapseKeys: [] as string[],
  });

  useEffect(() => {
    const componentTypeKeys = getComponentTypes(Object.entries(components));

    setStates({
      componentTypeKeys,
      activeCollapseKeys: componentTypeKeys,
    });
    setReactFlowModalTab(componentTypeKeys[0]);
  }, [components]);

  const menuItems =
    states.componentTypeKeys.length &&
    states.componentTypeKeys.map((type: string) => ({
      label:
        type === "input"
          ? "Data Sets"
          : type === "proc-block"
          ? "Analysis Blocks"
          : type === "output"
          ? "Terminator"
          : type,
      key: type,
    }));

  return (
    <>
      <div className="sidebar-head">
        <div className="title">
          <img src={libraryIcon} alt="" />
          <span>Block Library</span>
        </div>
        <Input
          onChange={(e) => setReactFlowModalsearchedValue(e.target.value)}
          type="search"
          prefix={<SearchOutlined />}
          placeholder="Search"
        />
      </div>
      <div className="sidebar-menu">
        <Menu
          defaultSelectedKeys={[states.componentTypeKeys[0]]}
          items={menuItems}
          onClick={(item) => setReactFlowModalTab(item.key)}
        />
      </div>
      <div className="sidebar-btns">
        <div>
          <Link to={`/dataset/${datasetId}`}>+ Connect Data</Link>
          <button disabled>+ Add Custom Model</button>
        </div>

        <a href="www.google.com" target={"_blank"}>
          <QuestionCircleFilled />
          Get Help
        </a>
      </div>
    </>
  );
};

const NodeCard = ({
  node,
  id,
  components,
  setCanvasNodes,
  canvasNodes,
}: {
  node: Component;
  id: string;
  components: Record<string, Component>;
  setCanvasNodes: React.Dispatch<React.SetStateAction<Node<FlowNodeData>[]>>;
  canvasNodes: Node<FlowNodeData>[];
}) => {
  const diagram = useAppSelector((e) => e.flow);

  const onNodeClick = () => {
    const component = components[id];
    const position = {
      x: -50,
      y: 70,
    };

    if (component) {
      const id: string = uuid();
      const data: Node<FlowNodeData> = {
        id: id,
        position: position,
        type: component.type,
        data: {
          componentID: id,
          name: component.displayName,
          type: component.type,
          label: component.displayName,
          inputs: [],
          outputs: [],
          inputPorts: [],
          outputPorts: [],
          componentIdentifier: component.identifier,
          propertiesValueMap: defaultPropertyValues(component),
        },
      };
      if (component.type === "capability") {
        let count = 0;
        diagram.nodes.forEach((node) => {
          if (node.type === "capability") count++;
        });
        data.data.propertiesValueMap["source"] = count;
      }
      switch (component.type) {
        case "capability":
          data.sourcePosition = Position.Right;
          break;
        case "output":
          data.targetPosition = Position.Left;
          break;
        default:
          data.sourcePosition = Position.Right;
          data.targetPosition = Position.Left;
          break;
      }
      inputs(component).forEach((tensor, idx) => {
        const name =
          tensor.displayName || `${component.displayName} input ${idx + 1}`;
        const id = uuid();
        data.data?.inputs.push({
          id,
          idx,
          name,
          tensor: tensor,
          type: "",
          alignment: "left",
          in: true,
          label: name,
        });
        data.data?.inputPorts.push();
      });
      if (data.data?.propertiesValueMap)
        outputs(component, data.data?.propertiesValueMap).forEach(
          (tensor, idx) => {
            const name =
              tensor.displayName ||
              `${component.displayName} output ${idx + 1}`;
            const id = uuid();
            data.data?.outputs.push({
              id,
              idx,
              name,
              tensor: tensor,
              type: "",
              alignment: "left",
              in: true,
              label: name,
            });
          }
        );
      setCanvasNodes((prev) => [...prev, data]);
    }
  };

  return (
    <div className="node-card">
      <div className="node-card-head">
        <Checkbox
          defaultChecked={diagram.nodes.some(
            (item) => item.data.name === node.displayName
          )}
          onClick={(e) => {
            //@ts-ignore
            if (e.target.checked) {
              onNodeClick();
            } else {
              const updatedCanvasNodes = canvasNodes.filter(
                (item) => item.data.name !== node.displayName
              );
              console.log(updatedCanvasNodes);
              setCanvasNodes(updatedCanvasNodes);
            }
          }}
        >
          {node.displayName}
        </Checkbox>
        {node.description && (
          <Popover
            className="node-card-popover"
            style={{
              fontWeight: "600",
            }}
            placement="right"
            title={`A ${node.type}`}
            content={
              <div>
                <p style={{ width: "200px", wordWrap: "break-word" }}>
                  {node.description}
                </p>
                <p
                  hidden={node.helperUrl === undefined || node.helperUrl === ""}
                >
                  <br />
                  <a href={node.helperUrl} target="_blank" rel="noreferrer">
                    More info
                  </a>
                </p>
              </div>
            }
            trigger="hover"
          >
            {node.description && <InfoCircleFilled />}
          </Popover>
        )}
      </div>
      <div className="node-card-body">
        <p>{node.description}</p>
        <div>
          <span>15 May 2022</span>
          <span>10.2Mb</span>
        </div>
      </div>
    </div>
  );
};
