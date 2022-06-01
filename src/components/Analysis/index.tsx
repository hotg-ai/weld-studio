import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Dropdown, DropdownOption } from "../common/dropdown";
import Modal from "../Dataset/components/modal";
import Table from "../Dataset/components/table";
import "./analysis.css";
import StudioCanvas from "./StudioCanvas";

const DummytTableData = [
  { name: "sam", age: 20, job: "developer" },
  { name: "sara", age: 24, job: "designer" },
  { name: "sara", age: 24, job: "designer" },
  { name: "sara", age: 24, job: "designer" },
  { name: "sara", age: 24, job: "designer" },
  { name: "sara", age: 24, job: "designer" },
  { name: "sara", age: 24, job: "designer" },
];
function Anaysis() {
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  const { id } = useParams();

  const fileInput = document.querySelector(".input-file") as HTMLInputElement,
    the_return = document.querySelector(".file-return")!;

  return (
    <div className="analysis_page">
      <div className="sidebar_left">
        <div className="back-link__container">
          <Link to={`/dataset/${id}`}>
            <img src="/assets/backArrow.svg" alt="<" />
            <span>Back</span>
          </Link>
        </div>

        <div className="modules__container">
          <div className="title">
            <span>Drag Modules</span>
          </div>

          <Dropdown title={"Data Columns"}>
            <DropdownOption>
              <div className="dropdownOption__Content pink">HHID: INTEGER</div>
              <div className="dropdownOption__Content pink">
                hahAVG_PN: FLOATaha
              </div>
              <div className="dropdownOption__Content pink">RCSR: INTEGER</div>
            </DropdownOption>
          </Dropdown>
          <Dropdown title={"Predictive Analytics (Proc Block)"}>
            <DropdownOption>
              <div className="dropdownOption__Content green">
                Linear Mixed Model
              </div>
            </DropdownOption>
          </Dropdown>
          <Dropdown title={"Image Classification"}>
            <DropdownOption>
              <div className="dropdownOption__Content blue">
                Classify Images
              </div>
              <div className="dropdownOption__Content blue">Predict Range</div>
            </DropdownOption>
          </Dropdown>
        </div>
        <button onClick={() => setSaveModalVisible(true)}>
          + Add custom Model
        </button>
      </div>

      <div className="analysis_page_content">
        <div className="studio__container">
          <div className="studio__content">
            <StudioCanvas />
          </div>
          <div className="sidebar_right">
            <button onClick={() => setCustomModalVisible(true)}>
              <img src="/assets/share.svg" alt="<" />
              <span>Save and Share</span>
            </button>
            <div className="properties__container">
              <div className="title">
                <img src="/assets/properties.svg" alt="" />
                <span>Properties</span>
              </div>
              <div className="inputs__container">
                <label>
                  Data Type: <input type="text" />
                </label>
                <label>
                  Parameter: <input type="text" />
                </label>
                <label>
                  Nullable: <input type="checkbox" />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="studio-table__container">
          <Table data={DummytTableData} />
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

export default Anaysis;
