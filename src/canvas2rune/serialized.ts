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
  label?: string;
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
