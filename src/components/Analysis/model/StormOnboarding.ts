import { Model, Output, Tensor } from ".";

export type LayerNodeModel = {
    id: string;
    type: string;
    x: number;
    y: number;
    ports: Port[];
    name: string;
    // eslint-disable-next-line
    extras?: any;
    locked?: boolean;
    color: string;
    componentID: string;
    componentIdentifier: string;
    propertiesValueMap: Record<string, string | number | undefined>;
};

export type LayerLinkModel = {
    id: string;
    type: string;
    source: string;
    sourcePort: string;
    target: string;
    targetPort: string;
    points: {
        x: number;
        y: number;
        type: string;
        selected: boolean;
        extras: any;
        id: string;
        locked: boolean;
    }[];
    labels: {
        offsetX: number;
        offsetY: number;
        type: string;
        selected: boolean;
        extras: any;
        id: string;
        locked: boolean;
    }[];
}

export type Port = {
    id: string;
    type: string;
    x?: number;
    y?: number;
    name: string;
    alignment: "left" | "right";
    parentNode?: string;
    links?: string[];
    in: boolean;
    label: string;
    idx: number;
    tensor: Tensor;
};

export type LayerModels = {
    [x: string]: LayerNodeModel | LayerLinkModel;
};

export type DiagramNodeLayer = {
    isSvg: boolean;
    transformed: boolean;
    models: { [x: string]: LayerNodeModel; };
    type: string;
    selected: boolean;
    // eslint-disable-next-line
    extras: any;
    id: string;
    locked: boolean;
};

export type DiagramLinkLayer = {
    isSvg: boolean;
    transformed: boolean;
    models: { [x: string]: LayerLinkModel; };
    type: string;
    selected: boolean;
    // eslint-disable-next-line
    extras: any;
    id: string;
    locked: boolean;
};

export type BuiltInComponent = {
    type: any;
    identifier: string;
    version: string;
};

/**
 * Components that can be safely serialized.
 */
export type SerializedComponent = Model | Output;

export type ResourceType = "string" | "binary";

export type ResourceDeclaration = {
    /**
     * A resource who's default value is specified inline.
     */
    inline?: string | null;
    /**
     * A resource who's default value is meant to be loaded from a file.
     */
    path?: string | null;
    type?: ResourceType & string;
};

export type SerializedDiagram = {
    offsetX: number;
    offsetY: number;
    zoom: number;
    gridSize: number;
    layers: [DiagramLinkLayer, DiagramNodeLayer];
    id: string;
    locked: boolean;
    customComponents: Record<string, SerializedComponent>;
    resources?: {
        [k: string]: ResourceDeclaration;
    };
};