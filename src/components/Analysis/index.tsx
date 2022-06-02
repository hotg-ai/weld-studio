import { Collapse } from "antd";
import useSelection from "antd/lib/table/hooks/useSelection";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useParams } from "react-router-dom";
import { storm2rune } from "src/canvas2rune";
import { SerializedFlowDiagram } from "src/canvas2rune/serialized";
import { useAppDispatch, useAppSelector } from "src/hooks/hooks";
import { saveProject } from "src/redux/actions/project/saveProject";
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

  const { id } = useParams();

  const buildAndRun = async (
    diagram: FlowElements,
    input: any
  ): Promise<string> => {
    const result = await storm2rune(
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

    invoke("compile", { runefile: result })
      .then((zune) => {
        console.log("ZUNE BUILT", zune);
        invoke("run", { zune: zune })
          .then(console.log)
          .catch((error) => {
            console.log("RUN ERROR", error);
          });
      })
      .catch((error) => {
        console.log("COMPILE ERROR", error);
      });
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
                const result = await buildAndRun(diagram, []);
                if (result) {
                  console.log("RESULT", result);

                  setTableData(
                    data.map((row) => {
                      return {
                        ...row,
                        result:
                          Math.floor(Math.random() * 100) > 50
                            ? "weak"
                            : "strong",
                      };
                    })
                  );
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
              {/* <div className="inputs__container">
                <label>
                  Data Type: <input type="text" />
                </label>
                <label>
                  Parameter: <input type="text" />
                </label>
                <label>
                  Nullable: <input type="checkbox" />
                </label>
              </div> */}
              <InputDimensions disabled />
              <Properties disabled />
              <OutputDimensions disabled />
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
