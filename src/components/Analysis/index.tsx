import { Collapse } from "antd";
import useSelection from "antd/lib/table/hooks/useSelection";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { storm2rune } from "src/canvas2rune";
import { SerializedFlowDiagram } from "src/canvas2rune/serialized";
import { useAppDispatch, useAppSelector } from "src/hooks/hooks";
import { FlowElements } from "src/redux/reactFlowSlice";
import { DatasetTypes } from "../Dataset";
import Modal from "../Dataset/components/modal";
import Table from "../Dataset/components/table";
import "./analysis.css";
import InputDimensions from "./InputDimensions";
import OutputDimensions from "./OutputDimensions";
import Properties from "./Properties";
import StudioCanvas from "./StudioCanvas";
import { ComponentsSelector } from "./StudioComponentsSelector";
import { diagramToRuneCanvas } from "./utils/FlowUtils";
import { FlowNodeData } from "./model/FlowNodeComponent";
import { Node } from "react-flow-renderer";
import { TensorDescriptionModel } from "./model";
import _ from "lodash";

function Analysis() {
  const diagram = useAppSelector((s) => s.flow);
  const components = useAppSelector((s) => s.builder.components);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [activeCollapseKeys, setActiveCollapseKeys] = useState([
    "Data Columns",
  ]);
  const dispatch = useAppDispatch();
  const { state } = useLocation();
  let dataColumns: string[] = [];
  let data: any = {};
  let dataTypes: DatasetTypes = {};

  Object.entries(state).map(([key, value]) => {
    if (key == "dataColumns") dataColumns = value;
    if (key == "data") data = value;
    if (key == "dataTypes") dataTypes = value;
  });

  const [tableData, setTableData] = useState(data);

  useEffect(() => {
    let newTable = data;

    const capabilities = diagram.nodes.filter(
      (node) => node.data.type === "capability"
    );

    let labels: string[] = capabilities.map((cap) => cap.data.label);

    newTable = newTable.map((o) => {
      if (labels && labels.length > 0) {
        let row = labels.reduce((acc, curr) => {
          acc[curr] = o[curr];
          return acc;
        }, {});
        if (!_.isEmpty(row)) return row;
      }
    });

    setTableData(newTable || []);
  }, [diagram]);

  const { id } = useParams();

  const buildAndRun = async (
    diagram: FlowElements,
    datasetTypes: DatasetTypes,
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
          break;
        case "u8":
          return Uint8Array.from(data);
          break;
        case "u16":
          return Uint32Array.from(data);
          break;
        case "u32":
          return Uint32Array.from(data);
          break;
        case "u64":
          return BigUint64Array.from(data);
          break;
        case "i8":
          return Int8Array.from(data);
          break;
        case "i16":
          return Int16Array.from(data);
          break;
        case "i32":
          return Int32Array.from(data);
          break;
        case "i64":
          return BigInt64Array.from(data);
          break;
        case "f32":
          return Float32Array.from(data);
          break;
        case "f64":
          return Float64Array.from(data);
          break;
      }
    };

    const convertTensorResult = (result: {
      element_type: string;
      dimensions: number[];
      buffer: any;
    }) => {
      const { element_type, dimensions, buffer } = result;
      switch (element_type.toLowerCase()) {
        case "utf8":
          return data;
          break;
        case "u8":
          return new Uint8Array(buffer.buffer, 0, 1);
          break;
        case "u16":
          return new Uint32Array(buffer.buffer, 0, 1);
          break;
        case "u32":
          return new Uint32Array(buffer.buffer, 0, 1);
          break;
        case "u64":
          return new BigUint64Array(buffer.buffer, 0, 1);
          break;
        case "i8":
          return new Int8Array(buffer.buffer, 0, 1);
          break;
        case "i16":
          return new Int16Array(buffer.buffer, 0, 1);
          break;
        case "i32":
          return new Int32Array(buffer.buffer, 0, 1);
          break;
        case "i64":
          return new BigInt64Array(buffer.buffer, 0, 1);
          break;
        case "f32":
          return new Float32Array(buffer.buffer, 0, 100);
          break;
        case "f64":
          return new Float64Array(buffer.buffer, 0, 1);
          break;
      }
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

    capabilities.map((node) => {
      const tensor = getConnectedInputTensor(node, diagram);
      if (tensor)
        input_tensors[node.data.label] = {
          element_type: tensor.elementType.toUpperCase(),
          dimensions: tensor.dimensions,
          buffer: Object.values(
            Uint8Array.from(
              getDataArrayFromType(dataMap[node.data.label], tensor.elementType)
            )
          ),
        };
    });
    let result;
    console.log("RUNEFILE, INPUT", rune, input_tensors);
    try {
      const zune = await invoke("compile", { runefile: rune });
      if (zune) {
        console.log("ZUNE BUILT", zune);
        try {
          result = await invoke("reune", {
            zune: zune,
            inputTensors: input_tensors,
          });
          if (result)
            console.log(
              "FO REAL RESULT",
              result,
              result.buffer,
              JSON.stringify(result),
              convertTensorResult(result)
            );
        } catch (error) {
          console.log("RUN ERROR", error);
        }
      }
    } catch (error) {
      console.log("COMPILE ERROR", error);
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
          <Link to={`/dataset/${id}`}>
            <img src="/assets/backArrow.svg" alt="<" />
            <span>Back</span>
          </Link>
        </div>
        <button onClick={() => setSaveModalVisible(true)}>
          + Add custom Model
        </button>
        <ComponentsSelector
          data={data}
          dataColumns={dataColumns}
          dataTypes={dataTypes}
        />
      </div>

      <div className="analysis_page_content">
        <div className="studio__container">
          <div className="studio__content">
            <StudioCanvas />
          </div>
          <div className="sidebar_right">
            <button
              onClick={async () => {
                console.log("DATA TYPES", dataTypes);
                // invoke("reune")
                //   .then(console.log)
                //   .catch((error) => {
                //     console.log("RUN ERROR", error);
                //   });
                const result = await buildAndRun(diagram, dataTypes, tableData);
                if (result) {
                  console.log("RESULT", result);
                }
              }}
            >
              {/* <img src="/assets/model.svg" alt="<" /> */}
              <span>{"</> "}Build &amp; Run</span>
            </button>
            <button onClick={() => setCustomModalVisible(true)}>
              {/* <img src="/assets/share.svg" alt="<" /> */}
              <span>Save and Share</span>
            </button>
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
          <Table data={tableData} />
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
    </div>
  );
}

export default Analysis;
