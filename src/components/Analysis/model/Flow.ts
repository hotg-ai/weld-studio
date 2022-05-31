import { Dimension } from ".";

type Tensor = {
    elementType: string;
    dimensions: Dimension[];
};

export type FlowNodePort = {
    name: string;
    id: string;
    type: string;
    in: boolean;
    parentNode?: string;
    tensor?: Tensor;
    // id: string;
    // type: string;
    // x: number;
    // y: number;
    // name: string;
    // alignment: "left" | "right";
    // parentNode?: string;
    // links: string[];
    // in: boolean;
    // label: string;
    // idx: number;
    // tensor?: Tensor;
};