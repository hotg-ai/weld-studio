import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
import CodeEditor from "./components/editor";
import "./dataset.css";

const Python = ({
  setPython,
  python,
  data,
  queryError,
  tables,
  result,
  isQueryLoading,
}: any) => {

  return (
    <div className="dataset_page">
      <div className="dataset__container">
        <div className="dataset__sidebar__container center">
          <div className="code__container">
            <div className="code__container-header">
              <div className="title">
                <img src="/assets/codeIcon.svg" alt="" />
                {/* <span>Sample.python</span> */}
              </div>
              <ClipLoader color="purple" loading={isQueryLoading} size={20} />
            </div>
            <CodeEditor setCode={(v) => setPython(v)} code={python} defaultLanguage="python" defaultValue="import numpy as np"/>
          </div>
        </div>
        <div style={{width: "500px"}}>Result: <p style={{ "whiteSpace": "pre" }}>{result}</p></div>
        <br />
        <div  >Error: {queryError}</div>
        </div>
    </div>
  );
};

export default Python;
