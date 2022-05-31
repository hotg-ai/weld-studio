import { Component } from "../components/Analysis/model";

export const ColorFromComponentTypeString = (
  type?: Component["type"]
): string => {
  let color = "Purple";
  switch (type) {
    case "capability":
      color = "Purple";
      break;
    case "model":
      color = "Pink";
      break;
    case "proc-block":
      color = "Java";
      break;
    case "output":
      color = "Green";
      break;
  }
  return color;
};

export const ColorFromComponentTypeHex = (type?: Component["type"]): string => {
  let color = "#7d2cff";
  switch (type) {
    case "capability":
      color = "#7d2cff";
      break;
    case "model":
      color = "#ff00e5";
      break;
    case "proc-block":
      color = "#106161";
      break;
    case "output":
      color = "#149a18";
      break;
  }
  return color;
};
