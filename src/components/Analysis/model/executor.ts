import { CanvasLink, CanvasNode, RuneCanvas } from "../utils/FlowUtils";

import { Port } from "./Storm";
import { TensorDescriptionModel } from ".";

export const getSourceNode = (
  diagram: RuneCanvas,
  id: string
): CanvasNode[] | undefined => {
  let result: CanvasNode[] = [];
  Object.entries(diagram.links).forEach(([idx, link]: [string, CanvasLink]) => {
    if (link.target === id) result.push(diagram.nodes[link.source]);
  });
  return result;
};

export const getTargetNode = (
  diagram: RuneCanvas,
  id: string
): CanvasNode[] | undefined => {
  let result: CanvasNode[] = [];
  Object.entries(diagram.links).forEach(([idx, link]: [string, CanvasLink]) => {
    if (link.source === id) result.push(diagram.nodes[link.target]);
  });
  return result;
};

export const getOutputs = (diagram: RuneCanvas): TensorDescriptionModel[][] => {
  let result: TensorDescriptionModel[][] = [];
  Object.entries(diagram.nodes).forEach(([id, node]: [string, CanvasNode]) => {
    if (node.data.type === "output") {
      const n = getSourceNode(diagram, node.data.id);
      let outputs: TensorDescriptionModel[] = [];
      if (n) {
        Object.entries(n[0].data.ports).forEach(
          ([id, port]: [string, Port]) => {
            if (port.in === false) {
              outputs.push(port.tensor);
            }
          }
        );
      }
      result.push(outputs);
    }
  });
  return result;
};
