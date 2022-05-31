import { AnyAction } from "redux";
import { Edge, Node, XYPosition } from "react-flow-renderer";
import { Component, Dimension, Tensor } from "../components/Analysis/model";
import { FlowNodeData } from "../components/Analysis/model/FlowNodeComponent";
import { Port, PortErrorComponent } from "../components/Analysis/model/Storm";
import { calculateSizebyDataType } from "../components/Analysis/Properties";
import capabilities from "../components/Analysis/model/capabilities";
import { isPropertyValueValid } from "../utils/FlowValidator";

export type FlowElements = {
  nodes: Node<FlowNodeData>[];
  edges: Edge<undefined>[];
};

type AddEdge = {
  type: "ADD_EDGE";
  payload: Edge<undefined>;
};

type AddNode = {
  type: "ADD_NODE";
  payload: Node<FlowNodeData>;
};

type RepositionNode = {
  type: "REPOSITION_NODE";
  payload: {
    id: string;
    position: XYPosition;
  };
};

type DeleteFlowElement = {
  type: "DELETE_EDGE" | "DELETE_NODE";
  payload: string;
};

type SetDiagramAction = {
  type: "SET_DIAGRAM";
  payload: FlowElements;
};

type UpdatePropertyAction = {
  type: "UPDATE_PROPERTY";
  payload: {
    node: Node<FlowNodeData>;
    name: string;
    value: string | number;
  };
};

type SetPortErrorAction = {
  type: "SET_PORT_ERROR";
  payload: {
    nodeId: string;
    portId: string;
    error: PortErrorComponent;
  };
};

type UnsetPortErrorAction = {
  type: "UNSET_PORT_ERROR";
  payload: {
    nodeId: string;
    portId: string;
  };
};

type UpdateTensorAction = {
  type: "UPDATE_TENSOR";
  payload: { selected: string; ports: Port[]; port: Port; tensor: Tensor };
};

type AcceptedActionTypes =
  | AddEdge
  | AddNode
  | RepositionNode
  | DeleteFlowElement
  | SetDiagramAction
  | UpdatePropertyAction
  | UpdateTensorAction
  | SetPortErrorAction
  | UnsetPortErrorAction;

export default function reactFlowDiagramReducer(
  oldState: FlowElements = { edges: [], nodes: [] },
  action: AnyAction | AcceptedActionTypes
) {
  let newState: FlowElements = { ...oldState };
  switch (action.type) {
    case "SET_DIAGRAM":
      newState = action.payload;
      break;
    case "ADD_EDGE":
      newState = { ...newState, edges: [...newState.edges, action.payload] };
      break;
    case "ADD_NODE":
      newState = { ...newState, nodes: [...newState.nodes, action.payload] };
      break;
    case "SET_EDGES":
      newState = { ...newState, edges: action.payload };
      break;
    case "SET_NODES":
      newState = { ...newState, nodes: action.payload };
      break;
    case "DELETE_EDGE":
      newState = {
        ...newState,
        edges: newState.edges.filter((e) => e.id != action.payload),
      };
      break;
    case "DELETE_NODE":
      newState = {
        ...newState,
        nodes: newState.nodes.filter((e) => e.id != action.payload),
      };
      break;
    case "REPOSITION_NODE":
      newState = {
        ...newState,
        nodes: newState.nodes.map((node) =>
          node.id === action.payload.id
            ? { ...node, position: action.payload.position }
            : node
        ),
      };
      break;
    case "UPDATE_PROPERTY":
      let properties: Record<string, string | number | undefined>;
      let ports: Port[] = [];
      let dd: Dimension[] = [];
      let errors: Record<string, string | number | undefined> = {};
      const components: Record<string, Component> = {
        ...action.payload.components,
      };
      if (action.payload.node.data) {
        properties = { ...action.payload.node.data.propertiesValueMap };
        properties[action.payload.name] = action.payload.value;
      }
      const name = action.payload.name;
      const v = action.payload.value;
      if (action.payload.node.data.propertiesErrorMap)
        errors = { ...action.payload.node.data.propertiesErrorMap };
      newState = {
        ...newState,
        nodes: newState.nodes.map((el: Node<FlowNodeData>) => {
          if (el.id === action.payload.node.id) {
            ports = [...el.data.outputs];
            const d = ports[0].tensor.dimensions;
            dd = d;
            if (name === "pixel_format") {
              let enumValue: number | undefined = undefined;
              const properties =
                capabilities().image.properties["pixel_format"];
              if (properties && properties.type === "string-enum") {
                enumValue = properties.enumValues.filter(
                  (item) => item.name === v
                )[0].value;
              }
              if (enumValue) {
                dd = [d[0], d[1], d[2], enumValue];
                const validity = isPropertyValueValid(
                  el.id,
                  name,
                  enumValue,
                  newState,
                  components
                );
                if (!validity.valid) errors[name] = validity.validValue;
                else errors[name] = undefined;
              }
            }
            if (name === "width") {
              dd = [d[0], action.payload.value, d[2], d[3]];
              const validity = isPropertyValueValid(
                el.id,
                name,
                action.payload.value,
                newState,
                components
              );
              if (!validity.valid) errors[name] = validity.validValue;
              else errors[name] = undefined;
            }
            if (name === "height") {
              dd = [d[0], d[1], action.payload.value, d[3]];
              const validity = isPropertyValueValid(
                el.id,
                name,
                action.payload.value,
                newState,
                components
              );
              if (!validity.valid) errors[name] = validity.validValue;
              else errors[name] = undefined;
            }
            if (name === "sample_duration_ms") {
              const hz = properties["hz"];
              if (hz && typeof hz === "number") {
                dd = [hz * (action.payload.value / 1000)];
                const validity = isPropertyValueValid(
                  el.id,
                  name,
                  hz * (action.payload.value / 1000),
                  newState,
                  components
                );
                if (!validity.valid) errors[name] = validity.validValue;
                else errors[name] = undefined;
              }
            }
            if (name === "hz") {
              const duration = properties["sample_duration_ms"];
              if (duration && typeof duration === "number") {
                dd = [action.payload.value * (duration / 1000)];
                const validity = isPropertyValueValid(
                  el.id,
                  name,
                  action.payload.value * (duration / 1000),
                  newState,
                  components
                );
                if (!validity.valid) errors[name] = validity.validValue;
                else errors[name] = undefined;
              }
            }
            if (name === "n") {
              dd = [d[0], action.payload.value, d[2], d[3]];
              const validity = isPropertyValueValid(
                el.id,
                name,
                action.payload.value,
                newState,
                components
              );
              if (!validity.valid) errors[name] = validity.validValue;
              else errors[name] = undefined;
            }
            if (name === "length") {
              const et = ports[0].tensor.elementType;
              if (et) dd = [calculateSizebyDataType(et, action.payload.value)];
              const validity = isPropertyValueValid(
                el.id,
                name,
                action.payload.value,
                newState,
                components
              );
              if (!validity.valid) errors[name] = validity.validValue;
              else errors[name] = undefined;
            }
            return {
              ...el,
              data: {
                ...el.data,
                propertiesValueMap: properties,
                propertiesErrorMap: errors,
                outputs: [
                  {
                    ...ports[0],
                    tensor: { ...ports[0].tensor, dimensions: dd },
                  },
                ],
              },
            };
          } else return el;
        }),
      };
      break;
    case "UPDATE_TENSOR": {
      const port: Port = { ...action.payload.port };
      port.tensor = { ...action.payload.tensor };
      let ports: Port[] = action.payload.ports.slice();
      ports = ports.map((p) => (p.id === port.id ? port : p));

      newState = {
        ...newState,
        nodes: newState.nodes.map((el: Node<FlowNodeData>) =>
          el.id === action.payload.selected
            ? {
                ...el,
                data: {
                  ...el.data,
                  outputs: [...ports],
                },
              }
            : el
        ),
      };
      break;
    }
    case "SET_PORT_ERROR": {
      const nodeIndex = newState.nodes.findIndex(
        (node) => node.id === action.payload.nodeId
      );
      if (nodeIndex && nodeIndex >= 0) {
        const Ports = newState.nodes[nodeIndex].data.outputs.slice();
        const portIndex = Ports.findIndex(
          (port) => port.id === action.payload.portId
        );
        if (portIndex && portIndex >= 0) {
          Ports[portIndex] = {
            ...Ports[portIndex],
            errors: action.payload.error,
          };
        }
        newState = {
          ...newState,
          nodes: newState.nodes.map((el: Node<FlowNodeData>) =>
            el.id === action.payload.nodeId
              ? { ...el, data: { ...el.data, outputs: Ports } }
              : el
          ),
        };
      }
      break;
    }
    case "UNSET_PORT_ERROR": {
      const nodeIndex = newState.nodes.findIndex(
        (node) => node.id === action.payload.nodeId
      );
      if (nodeIndex && nodeIndex >= 0) {
        const Ports = newState.nodes[nodeIndex].data.outputs.slice();
        const portIndex = Ports.findIndex(
          (port) => port.id === action.payload.portId
        );
        if (portIndex && portIndex >= 0) {
          Ports[portIndex] = {
            ...Ports[portIndex],
            errors: undefined,
          };
        }
        newState = {
          ...newState,
          nodes: newState.nodes.map((el: Node<FlowNodeData>) =>
            el.id === action.payload.nodeId
              ? { ...el, data: { ...el.data, outputs: Ports } }
              : el
          ),
        };
      }
      break;
    }
  }
  return newState;
}
