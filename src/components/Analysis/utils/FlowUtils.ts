import { Edge, Node, Position } from "react-flow-renderer";
import { LoadedProject } from "../../../redux/actions/project";
import { FlowElements } from "../../../redux/reactFlowSlice";
import { ProjectInfo } from "../../../redux/reducers/builder";
import {
  Capability,
  Component,
  Model,
  ProcBlockComponent,
  TensorDescriptionModel,
} from "../model";
import { FlowNodeData } from "../model/FlowNodeComponent";
import {
  LayerLinkModel,
  LayerNodeModel,
  Port,
  ResourceDeclaration,
  SerializedComponent,
  SerializedDiagram,
} from "../model/Storm";

export type CanvasNodePort = {
  name: string;
  label: string;
  type: string;
  tensor?: TensorDescriptionModel;
};

export type CanvasNodeData = {
  id: string;
  type: string;
  label: string;
  inputPorts?: string[];
  outputPorts?: string[];
  ports: Record<string, Port>;
  name: string;
  componentID: string;
  componentIdentifier: string;
  propertiesValueMap: Record<string, string | number | undefined>;
};

export type CanvasNode = {
  component: string;
  position: {
    x: number;
    y: number;
  };
  sourcePosition?: Position;
  targetPosition?: Position;
  data: CanvasNodeData;
};

export type CanvasLink = {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
};

export type CanvasComponent = {
  type: string;
  identifier: string;
  version: string;
};

export type RuneResource = {
  path?: string;
  type: string;
  inline?: string;
};

export type RuneCanvas = {
  runeCanvasVersion: string;
  name: string;
  diagram?: {
    position: number[];
    zoom: number;
  };
  nodes: Record<string, CanvasNode>;
  links: Record<string, CanvasLink>;
  components: Record<string, SerializedComponent>;
  resources?: Record<string, ResourceDeclaration>;
};

export const storm2flow = (
  project: ProjectInfo,
  diagram: SerializedDiagram
): RuneCanvas => {
  const nodes: Record<string, CanvasNode> = {};
  const links: Record<string, CanvasLink> = {};
  Object.entries(diagram.layers[1].models).forEach(
    ([id, model]: [string, LayerNodeModel]) => {
      const node: CanvasNode = {
        component: model.type,
        position: { x: model.x, y: model.y },
        data: {
          id,
          type: model.type,
          label: model.name.split("----")[0],
          ports: model.ports.reduce(
            (map: Record<string, Port>, port) => (
              (map[port.id] = {
                name: port.name,
                idx: port.idx,
                id: port.id,
                type: port.type,
                in: port.in,
                parentNode: port.parentNode,
                alignment: port.alignment,
                label: port.label,
                tensor: {
                  elementType: port.tensor?.elementType,
                  dimensions: port.tensor?.dimensions || [],
                },
              }),
              map
            ),
            {}
          ),
          name: model.name,
          propertiesValueMap: model.propertiesValueMap,
          componentID: model.componentID,
          componentIdentifier: model.componentIdentifier,
        },
      };
      switch (model.type) {
        case "capability":
          node.sourcePosition = Position.Right;
          break;
        case "output":
          node.targetPosition = Position.Left;
          break;
        default:
          node.sourcePosition = Position.Right;
          node.targetPosition = Position.Left;
          break;
      }
      nodes[id] = node;
    }
  );
  Object.entries(diagram.layers[0].models).forEach(
    ([id, model]: [string, LayerLinkModel]) => {
      const link: CanvasLink = {
        id: model.id,
        source: model.source,
        sourceHandle: model.sourcePort,
        target: model.target,
        targetHandle: model.targetPort,
      };
      links[id] = link;
    }
  );
  return {
    runeCanvasVersion: "0.2.0",
    name: project.name,
    diagram: {
      position: [diagram.offsetX, diagram.offsetY],
      zoom: diagram.zoom,
    },
    nodes: nodes,
    links: links,
    components: diagram.customComponents,
    resources: diagram.resources,
  };
};

export const getDimensions = (
  componentID: string,
  port: Port,
  components: Record<string, Component>
): TensorDescriptionModel => {
  const result: TensorDescriptionModel = { ...port.tensor };

  if (!components[componentID])
    throw new Error(`${componentID} is not a known/registered Component ID`);

  let component = { ...components[componentID] };

  if (component.type == "capability") {
    return { ...result, dimensionType: "fixed" };
  }

  if (component.type == "output") {
    return { ...result, dimensionType: "dynamic" };
  }

  if (component.type == "proc-block") {
    component = component as ProcBlockComponent;
    if (port.in) {
      return {
        ...result,
        dimensionType: component.exampleInputs[port.idx].dimensionType,
      };
    } else {
      return {
        ...result,
        dimensionType: component.exampleOutputs[port.idx].dimensionType,
      };
    }
  }

  if (component.type == "model") {
    component = component as Model;
    if (port.in) {
      return {
        ...result,
        dimensionType: component.inputs[port.idx].dimensionType,
      };
    } else {
      return {
        ...result,
        dimensionType: component.outputs[port.idx].dimensionType,
      };
    }
  }

  return result;
};

export const flowCanvasToDiagram = (
  diagram: RuneCanvas,
  components: Record<string, Component>
): FlowElements => {
  const flowDiagram: FlowElements = { edges: [], nodes: [] };
  Object.entries(diagram.nodes).forEach(([id, node]: [string, CanvasNode]) => {
    const nodePorts: Port[] = [];
    Object.entries(node.data.ports).forEach(([k, v]: [string, Port]) => {
      const port = { ...v };
      port.tensor = getDimensions(node.data.componentID, port, components);
      nodePorts.push(port);
    });
    const flowNode: Node<FlowNodeData> = {
      id: id,
      type: node.component,
      position: node.position,
      data: {
        componentID: node.data.componentID,
        componentIdentifier: node.data.componentIdentifier,
        name: node.data.name,
        type: node.data.type,
        label: node.data.label,
        inputs: nodePorts.filter((p) => p.in === true),
        outputs: nodePorts.filter((p) => p.in === false),
        inputPorts: [],
        outputPorts: [],
        propertiesValueMap: node.data.propertiesValueMap || {},
      },
    };
    if (node.sourcePosition)
      flowNode.sourcePosition = node.sourcePosition as Position;
    if (node.targetPosition)
      flowNode.targetPosition = node.targetPosition as Position;

    flowDiagram.nodes.push(flowNode);
  });
  Object.entries(diagram.links).forEach(([id, link]: [string, CanvasLink]) => {
    const flowEdge: Edge<undefined> = {
      id: id,
      source: link.source,
      sourceHandle: link.sourceHandle,
      target: link.target,
      targetHandle: link.targetHandle,
      animated: false,
      type: "step",
    };
    flowDiagram.edges.push(flowEdge);
  });
  return flowDiagram;
};

export const sanitizeResourceNames = (resourceName: string): string => {
  return resourceName.replace(/\-/g, "");
};

const customComponents = (
  components: Record<string, Component | undefined>
): Record<string, SerializedComponent> => {
  const serializable: Record<string, SerializedComponent> = {};

  for (const [key, value] of Object.entries(components)) {
    if (
      value &&
      value.source === "custom" &&
      (value.type === "output" || value.type === "model")
    ) {
      serializable[key] = value;
    }
  }

  return serializable;
};

export const diagramToRuneCanvas = (
  project: LoadedProject,
  resources: Record<string, ResourceDeclaration>,
  components: Record<string, Component | undefined>,
  diagram: FlowElements
): RuneCanvas => {
  const nodes: Record<string, CanvasNode> = {};
  const links: Record<string, CanvasLink> = {};
  const rez = { ...resources };
  diagram.nodes.forEach((node) => {
    const e = node as Node<FlowNodeData>;
    if (e.data) {
      const ports: Record<string, Port> = {};
      e.data.inputs.forEach((i) => {
        ports[i.id] = {
          idx: i.idx,
          id: i.id,
          name: i.name,
          label: i.label,
          type: i.type,
          tensor: i.tensor,
          in: true,
          alignment: i.alignment,
        };
      });
      e.data.outputs.forEach(
        (i) =>
          (ports[i.id] = {
            idx: i.idx,
            id: i.id,
            name: i.name,
            label: i.label,
            type: i.type,
            tensor: i.tensor,
            in: false,
            alignment: i.alignment,
          })
      );
      const node: CanvasNode = {
        component: e.data.type,
        position: e.position,
        data: {
          id: e.id,
          type: e.data.type,
          name: e.data.type,
          label: e.data.label,
          ports: ports,
          propertiesValueMap: e.data.propertiesValueMap,
          componentID: e.data.componentID,
          componentIdentifier: e.data.componentIdentifier,
        },
      };
      if (e.sourcePosition) node.sourcePosition = e.sourcePosition;
      if (e.targetPosition) node.targetPosition = e.targetPosition;
      nodes[node.data.id] = node;
      if (e.data.componentID && e.data.componentID.endsWith("label")) {
        rez[`resource_${sanitizeResourceNames(e.id)}`] = {
          path: `./${sanitizeResourceNames(e.id)}`,
          type: "string",
        };
      }
      if (e.data.type === "proc-block") {
        const name = e.data.componentID.split("proc-block/")[1];
        e.data.componentIdentifier = `https://func.hotg.ai/function/sbfs/pb/${name}.wasm`;
        console.log(e.data);
      }
      if (e.data.type === "model") {
        const name = e.data.componentID.split("proc-block/")[1];
        e.data.componentIdentifier = `https://assets.hotg.ai/models/tflite/${name}.tflite`;
        console.log(e.data);
      }
    }
  });
  diagram.edges.forEach((edge) => {
    const e = edge as Edge<undefined>;
    const link: CanvasLink = {
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle || "",
      target: e.target,
      targetHandle: e.targetHandle || "",
    };
    links[link.id] = link;
  });

  const result: RuneCanvas = {
    name: "",
    runeCanvasVersion: "0.2.0",
    nodes: nodes,
    links: links,
    components: customComponents(components),
    resources: rez,
  };
  return result;
};
