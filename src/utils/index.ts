import { Message } from "console-feed/lib/definitions/Console";
import { Log } from "../redux/builderSlice";

export const openNotification = (
  id: string,
  message: string,
  status: "success" | "error" | "info" | "warning",
  placement:
    | "bottom-center"
    | "top-center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right",
  dispatch: any,
  logs: Message[]
) => {
  logError(message, dispatch, logs);
};

export const logError = (message: string, dispatch: any, logs: Message[]) => {
  const doesMessageExist =
    logs.length > 1 && logs.filter((item: any) => item.data[1] === message)[0];

  //if the message does not exist already, then log the message
  if (!doesMessageExist) {
    dispatch(
      Log({
        type: "warn",
        message,
      })
    );
  }
};

export const detectInvalidNodes = (
  nodeId: string | undefined,
  status: "processing" | "invalid" | "valid"
) => {
  // Each nodeBox has an data-id attribute and we need to pass that specific node's id to this function in order to give it a specific style depends on status

  const nodeBoxes: Element[] = Array.from(
    document.querySelectorAll(".react-flow__node")
  );

  const node = nodeBoxes.filter((node: any) => node.dataset.id === nodeId)[0];

  if (node) {
    if (status === "invalid") {
      node.setAttribute("data-status", "invalid");
    } else if (status === "processing") {
      node.setAttribute("data-status", "processing");
    } else if (status === "valid") {
      node.setAttribute("data-status", "valid");
    }
  }
};

export const detectInvalidNodesPort = (
  portId: string | undefined,
  status: "processing" | "invalid" | "valid"
) => {
  // Each port div has an data-handleid attribute and we need to pass that specific port handleid to this function in order to give it a specific style depends on status
  const ports: Element[] = Array.from(
    document.querySelectorAll(".react-flow__handle")
  );

  const port = ports.filter((port: any) => port.dataset.handleid === portId)[0];
  //   dispatch(
  //     Log({
  //       //Dispaching error to Terminal
  //       // type: "info" | "error" | "log" | "debug" | "warn" | "table" | "clear" | "time" | "timeEnd" | "count" | "assert" | "command" | "result" | "rawHTML";
  //       type: "error",
  //       message: "----- testing -----"
  //     })
  //   );

  if (port) {
    if (status === "invalid") {
      port.setAttribute("data-status", "invalid");
    } else if (status === "processing") {
      port.setAttribute("data-status", "processing");
    } else if (status === "valid") {
      port.setAttribute("data-status", "valid");
    }
  }
};

export const resetInvalidNodes = (nodeId: string | undefined) => {
  const nodeBoxes: Element[] = Array.from(
    document.querySelectorAll(".react-flow__node")
  );

  const node = nodeBoxes.filter((node: any) => node.dataset.id === nodeId)[0];

  if (node) {
    const status = node.getAttribute("data-status");

    if (status) {
      node.removeAttribute("data-status");
    }
  }
};

export const resetInvalidNodesPort = (portId: string | undefined) => {
  const ports: Element[] = Array.from(
    document.querySelectorAll(".react-flow__handle")
  );

  const port = ports.filter((port: any) => port.dataset.handleid === portId)[0];

  if (port) {
    const status = port.getAttribute("data-status");

    if (status) {
      port.removeAttribute("data-status");
    }
  }
};
