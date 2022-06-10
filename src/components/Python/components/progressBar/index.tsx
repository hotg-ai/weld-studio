import React from "react";
import "./progressBar.css";

interface props {
  percent: string;
}
const ProgressBar = ({ percent }: props) => {
  return (
    <div className="progressBar__container">
      <div style={{ width: percent }} className="bar" />
      <span> {percent}</span>
    </div>
  );
};

export default ProgressBar;
