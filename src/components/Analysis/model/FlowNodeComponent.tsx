import {
  Connection,
  Handle,
  Position,
  useReactFlow,
} from "react-flow-renderer";
import { useAppDispatch, useAppSelector } from "../../../hooks/hooks";
import { ClearSelectedNode, SelectNode } from "../../../redux/builderSlice";
import { Component, TensorDescriptionModel } from ".";
import { isConnectionValid } from "../utils/FlowValidator";
import {
  ColorFromComponentTypeHex,
  ColorFromComponentTypeString,
} from "../utils/ForgeNodeUtils";
import deleteBlackSvg from "../icons/deleteBlack.svg";

import { Port, PortErrorComponent } from "./Legacy";

export type ForgeNodeData = {
  type: Component["type"];
  label?: string;
  text?: string;
  inputs?: Record<string, string>[];
  outputs?: Record<string, string>[];
};

export type ForgeNodeProps = {
  data: ForgeNodeData;
  dragHandle?: any;
  id: string;
  isConnectable: boolean;
  isDragging?: boolean;
  selected: boolean;
  sourcePosition?: string;
  targetPosition?: string;
  type: string;
  xPos: number;
  yPos: number;
};

type PortsData = {
  name: string;
  label: string;
  type: "input" | "output";
  tensor: TensorDescriptionModel;
};

enum PortModelAlignment {
  TOP = "top",
  LEFT = "left",
  BOTTOM = "bottom",
  RIGHT = "right",
}

export type FlowNodeDataPorts = Record<string, PortsData>;

export type FlowNodePort = {
  name?: string;
  alignment?: PortModelAlignment;
  parentNode?: string;
  links?: string[];
  x?: number;
  y?: number;
  type?: string;
  selected?: boolean;
  extras?: any;
  id: string;
  locked?: boolean;
  tensor: TensorDescriptionModel;
};

export type FlowNodeData = {
  componentID: string;
  componentIdentifier: string;
  name: string;
  type: string;
  label: string;
  inputs: Port[];
  outputs: Port[];
  inputPorts: string[];
  outputPorts: string[];
  propertiesValueMap: Record<string, string | number | undefined>;
  propertiesErrorMap?: Record<string, string | number | undefined>;
};

export const FlowNodeComponent = (props: ForgeNodeProps) => {
  const components = useAppSelector((s) => s.builder.components);
  const diagram = useAppSelector((s) => s.flow);
  const dispatch = useAppDispatch();
  const { getNodes, setNodes } = useReactFlow();

  const isValidConnection = (connection: Connection) => {
    const result = isConnectionValid(connection, diagram, components);
    const portError: PortErrorComponent = {};
    if (!result.valid)
      result.error?.forEach((error) => {
        if (
          error.code === 0 &&
          result.error &&
          error.target &&
          error.target.type === "port"
        ) {
          if (error.payload && error.payload["dims"])
            portError.dims = error.payload["dims"];
          if (error.payload && error.payload["type"])
            portError.type = error.payload["type"];
          if (error.payload && error.payload["portId"])
            portError.portId = error.payload["portId"];
        }
        if (
          error.code === 0 &&
          result.error &&
          error.target &&
          error.target.type === "node"
        ) {
          dispatch(SelectNode({ id: error.target?.id }));
          // expressValidationHinting(
          //   result.error,
          //   undefined,
          //   dispatch,
          //   forgeLogs
          // );
        }
      });
    return result.valid || result.connectOnError;
  };

  const nodeDeleteHandler = async () => {
    await setNodes(getNodes().filter((node) => node.id !== props.id));
    await dispatch(ClearSelectedNode());
    await dispatch({ type: "DELETE_NODE", payload: props.id });
  };

  return (
    <div
      className={`StudioBody--middle__up__item StudioBody--middle__up__item${ColorFromComponentTypeString(
        props.data.type
      )}`}
    >
      {props.data.inputs?.map((input, index, inputs) => {
        return (
          <Handle
            isValidConnection={isValidConnection}
            key={`${props.data.label}-input-${index}`}
            type="target"
            position={Position.Left}
            id={`${input.id}`}
            style={{
              top: `${(
                Math.floor(100 / (inputs.length + 1)) *
                (index + 1)
              ).toString()}%`,
              borderRadius: "50%",
              backgroundColor: "#FFF",
              width: "15px",
              height: "15px",
              border: `solid 2px ${ColorFromComponentTypeHex(props.data.type)}`,
              left: "-15px",
              color: "#000",
              fontSize: "6px",
              textAlign: "center",
            }}
          >
            {index + 1}
          </Handle>
        );
      })}
      <div className="StudioBody--middle__up__item__id">
        <button className="nodeDelete_btn" onClick={nodeDeleteHandler}>
          <img src={deleteBlackSvg} alt="" />
        </button>
        <input type="text" defaultValue={props.data.label} />
        <div className="id-container">
          <span>id: </span> <span>{props.id.split("-")[0]}</span>
        </div>
      </div>
      {props.data.outputs?.map((output, index, outputs) => {
        return (
          <Handle
            isValidConnection={isValidConnection}
            key={`${props.data.label}-output-${index}`}
            type="source"
            position={Position.Right}
            id={`${output.id}`}
            style={{
              top: `${(
                Math.floor(100 / (outputs.length + 1)) *
                (index + 1)
              ).toString()}%`,
              borderRadius: "50%",
              backgroundColor: "#FFF",
              width: "15px",
              height: "15px",
              border: `solid 2px ${ColorFromComponentTypeHex(props.data.type)}`,
              right: "-8px",
              color: "#000",
              fontSize: "6px",
              textAlign: "center",
            }}
          >
            {index + 1}
          </Handle>
        );
      })}
    </div>
  );
};
