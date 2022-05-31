// In theory, this should be synchronised with the serialized diagram from forge:
// https://github.com/hotg-ai/hammer-forge/blob/2d7257ec696e07d59dc52530ed27ba8a890c188c/forge/src/screens/Studio/StormApplication.tsx
//
// Which comes from here:
// https://github.com/projectstorm/react-diagrams/blob/3d0521cc934b1430d6c8f3b109d9ec6d0b19f3e2/packages/react-canvas-core/src/entities/canvas/CanvasModel.ts#L159-L170

import { ResourceDeclaration } from "./Runefile";

export type SerializedFlowDiagram = {
  runeCanvasVersion: string;
  name?: string;
  diagram?: {
    position: number[];
    zoom: number;
  };
  nodes: Record<string, DiagramNode>;
  links: Record<string, Edge>;
  components: Record<string, CanvasComponent>;
  resources: Record<string, ResourceDeclaration>;
};

export type CanvasComponent = {
  type: string;
  identifier: string;
  version: string;
};

export type FlowElement = DiagramNode | Link;

export type FlowNodeData = {
  name: string;
  type: string;
  label: string;
  ports: Record<string, Port>;
  componentIdentifier?: string;
  componentID?: string;
  propertiesValueMap: Record<string, string | number>;
};

export type DiagramPosition = {
  x: number;
  y: number;
};

export type Position = "left" | "top" | "right" | "bottom";

export type DiagramNode = {
  id: string;
  position: DiagramPosition;
  type?: string;
  data?: FlowNodeData;
  className?: string;
  targetPosition?: Position;
  sourcePosition?: Position;
  isHidden?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  dragHandle?: string;
};

export type SerializedDiagram = {
  layers: Layer[];
  resources: Record<string, ResourceDeclaration>;
};

export type Layer = {
  type: string;
  models: Record<string, Model | undefined>;
};

export type Port = {
  name: string;
  id: string;
  links: string[];
  type: string;
  in: boolean;
  parentNode?: string;
  tensor?: Tensor;
};

export type Tensor = {
  elementType: string;
  dimensions: number[];
};

export type Node = {
  type: "capability" | "proc-block" | "model" | "output" | string;
  ports?: Port[];
  id: string;
  name: string;
  componentIdentifier: string;
  propertiesValueMap?: Record<string, string | number>;
};

export type Link = {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
};

export type Edge = {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
};

export type Model = Node | Link;
