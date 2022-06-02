import _ from "lodash";
import {
  Connection,
  Node,
  getIncomers,
  getOutgoers,
  Edge,
} from "react-flow-renderer";
import { FlowElements } from "../redux/reactFlowSlice";
import { detectInvalidNodes, detectInvalidNodesPort } from "../utils";
import { Component } from "../components/Analysis/model";
import { FlowNodeData } from "../components/Analysis/model/FlowNodeComponent";

export type ValidatorErrorHintTarget = {
  type: "edge" | "port" | "node";
  id: string;
};

export type ElementType =
  | "utf8"
  | "u8"
  | "u16"
  | "u32"
  | "u64"
  | "i8"
  | "i16"
  | "i32"
  | "i64"
  | "f32"
  | "f64";

export type ValidatorError = {
  code: number;
  message: string;
  target?: ValidatorErrorHintTarget;
  payload?: Record<string, string>;
};

export type ValidatorResult = {
  error?: ValidatorError[];
  connectOnError: boolean;
  valid: boolean;
};

const generatePortNodeMap = (
  type: "inputs" | "outputs" | "all",
  diagram: FlowElements
): Record<string, string> => {
  const portNodeMap: Record<string, string> = {};
  diagram.nodes.forEach((node) => {
    if (type === "all" || type === "inputs")
      node.data.inputs.forEach((port) => {
        portNodeMap[port.id] = node.id;
      });
    if (type === "all" || type === "outputs")
      node.data.outputs.forEach((port) => {
        portNodeMap[port.id] = node.id;
      });
  });
  return portNodeMap;
};

const generateEdgeNodeMap = (
  diagram: FlowElements
): Record<string, Connection> => {
  const edgeNodeMap: Record<string, Connection> = {};
  diagram.edges.forEach((edge) => {
    const { source, sourceHandle, target, targetHandle } = edge;
    edgeNodeMap[edge.id] = {
      source,
      sourceHandle: sourceHandle || "",
      target,
      targetHandle: targetHandle || "",
    };
  });
  return edgeNodeMap;
};

type HintResponse = {
  hintTargets?: string[];
  valid: boolean;
};

const everyInputPortHasEdge = (
  inputPortsNodeMap: Record<string, string>,
  diagram: FlowElements
): HintResponse => {
  const result: HintResponse = { valid: true };
  let unConnectedInputPorts = Object.keys(inputPortsNodeMap);
  diagram.edges.forEach((edge) => {
    if (edge.targetHandle)
      unConnectedInputPorts = unConnectedInputPorts.filter(
        (item) => item !== edge.targetHandle
      );
  });
  if (unConnectedInputPorts.length !== 0) {
    result.valid = false;
    result.hintTargets = unConnectedInputPorts;
  }
  return result;
};

const everyOutputPortHasEdge = (
  outputPortsNodeMap: Record<string, string>,
  diagram: FlowElements
): HintResponse => {
  const result: HintResponse = { valid: true };
  let unConnectedOutputPorts = Object.keys(outputPortsNodeMap);
  diagram.edges.forEach((edge) => {
    if (edge.sourceHandle)
      unConnectedOutputPorts = unConnectedOutputPorts.filter(
        (item) => item !== edge.sourceHandle
      );
  });
  if (unConnectedOutputPorts.length !== 0) {
    result.valid = false;
    result.hintTargets = unConnectedOutputPorts;
  }
  return result;
};

const isSourceTargetSame = (connection: Connection): boolean => {
  let result = false;
  if (connection.source === connection.target) result = true;
  return result;
};

const isCreatingCycle = (
  connection: Connection,
  targetNode: Node,
  diagram: FlowElements
): boolean => {
  let cycle = false;
  const outgoers = getOutgoers(targetNode, diagram.nodes, diagram.edges);
  const incomers = getIncomers(targetNode, diagram.nodes, diagram.edges);
  if (incomers.length === 0) return false;
  if (incomers.filter((node) => node.id === connection.source).length > 0) {
    return true;
  } else {
    incomers.forEach((node) => {
      if (isCreatingCycle(connection, node, diagram)) {
        cycle = true;
        return cycle;
      }
    });
  }
  return cycle;
};

const isGangbang = (
  connection: Connection,
  targetNode: Node<FlowNodeData>,
  diagram: FlowElements
): boolean => {
  if (
    diagram.edges.filter(
      (edge) => edge.targetHandle === connection.targetHandle
    ).length > 0
  ) {
    if (targetNode.data.type.toLowerCase() === "output") return false;
    else return true;
  }

  return false;
};

type TensorValidityResult = {
  message: string;
  result: boolean;
  payload?: Record<string, string>;
  validValue?: string | number;
};

type Dimension = number | null;

export const isTensorIncompatible1 = (
  message: string,
  label: string,
  acceptedTypes: (ElementType | undefined)[],
  elementType?: ElementType | undefined,
  targetDimensionType?: string
): string => {
  if (
    acceptedTypes &&
    acceptedTypes.length &&
    acceptedTypes.find((type) => type === elementType) === undefined &&
    targetDimensionType !== "dynamic"
  ) {
    return `${message} ${label} accepts ('${acceptedTypes.join(
      "','"
    )}') types. You provided ${elementType}`;
  } else return "no error";
};

export const isTensorIncompatible2 = (
  message: string,
  label: string,
  sourceElementType: ElementType | undefined,
  targetElementType: ElementType | undefined,
  sourceDimensions: Dimension[],
  targetDimensions: Dimension[]
): string => {
  if (!_.isEqual(targetDimensions, sourceDimensions)) {
    return `${message} ${label} accepts ${targetElementType} types with these EXACT! dimensions [${targetDimensions.join(
      ","
    )}]. You provided ${sourceElementType} type with [${sourceDimensions.join(
      ","
    )}]`;
  } else {
    return "no error";
  }
};

export const isTensorIncompatible3 = (
  message: string,
  label: string,
  sourceElementType: ElementType | undefined,
  targetElementType: ElementType | undefined,
  sourceDimensions: Dimension[],
  targetDimensions: Dimension[],
  targetDimensionType: string | undefined
): string => {
  try {
    if (
      sourceDimensions.length !== targetDimensions.length &&
      targetDimensionType !== "dynamic"
    ) {
      throw new Error(
        `${message} ${label} accepts ${
          targetDimensions.length
        }-D tensor. You provided ${
          sourceDimensions.length
        }-D tensor with shape [${sourceDimensions.join(",")}]`
      );
    } else {
      targetDimensions.forEach((dim, index) => {
        if (dim !== 0)
          if (dim !== sourceDimensions[index])
            throw new Error(
              `${message} ${label} accepts ${targetElementType} types with [${targetDimensions.join(
                ","
              )}]. You provided ${sourceElementType} type with [${sourceDimensions.join(
                ","
              )}]`
            );
      });
    }
  } catch (e: any) {
    return e.message;
  }
  return "no error";
};

export const isTensorIncompatible4 = (
  message: string,
  label: string,
  sourceElementType: ElementType | undefined,
  targetElementType: ElementType | undefined,
  sourceDimensions: Dimension[],
  targetDimensions: Dimension[],
  targetDimensionType: string | undefined
): string => {
  for (let i = 0; i < sourceDimensions.length; i++) {
    const sourceDimension: Dimension = sourceDimensions[i];
    const targetDimension: Dimension = targetDimensions[i];

    if (targetDimension === 0) {
      // the next node's input port can accept any number of elements in this
      // dimension. For example, if it says the accepted shape is "f32[1, 0, 2]",
      // I could pass in a "f32[1, 5, 2]" or a "f32[1, 9000, 2]", but not a "f32[2, 2, 2]".
      //
      // Think of the "0" as a wildcard.
      continue;
    } else if (targetDimension != sourceDimension) {
      return `${message} ${label} accepts ${targetElementType} types with [${targetDimensions.join(
        ","
      )}]. You provided ${sourceElementType} type with [${sourceDimensions.join(
        ","
      )}]`;
    }
  }
  return "no error";
};

export const isTensorIncompatible = (
  connection: Connection | Edge,
  diagram: FlowElements,
  components: Record<string, Component>
): TensorValidityResult => {
  const result: TensorValidityResult = {
    message: "Tensor Mismatch:",
    result: false,
  };
  const sourceNode: Node<FlowNodeData> = diagram.nodes.filter(
    (node) => node.id === connection.source
  )[0];
  const targetNode: Node<FlowNodeData> = diagram.nodes.filter(
    (node) => node.id === connection.target
  )[0];

  const sourcePortTensor = sourceNode.data.outputs.filter(
    (port) => port.id === connection.sourceHandle
  )[0].tensor;
  const targetPortTensor = targetNode.data.inputs.filter(
    (port) => port.id === connection.targetHandle
  )[0].tensor;

  if (
    targetNode.type !== "output" &&
    targetPortTensor.dimensionType !== "dynamic"
  ) {
    const component = components[targetNode.data.componentID];
    const i = targetNode.data.inputs.findIndex(
      (port) => port.id === connection.targetHandle
    );
    let acceptedTypes = [targetNode.data?.inputs[i].tensor.elementType];
    if (
      component &&
      component.acceptedInputElementTypes &&
      component.acceptedInputElementTypes[i]
    )
      acceptedTypes = component.acceptedInputElementTypes?.[i].elementTypes;

    if (
      acceptedTypes.find((type) => type === sourcePortTensor.elementType) ===
      undefined
    ) {
      const message: string = isTensorIncompatible1(
        result.message,
        targetNode.data.label,
        acceptedTypes,
        sourcePortTensor.elementType,
        targetPortTensor.dimensionType
      );
      result.message = message;
      result.result = true;
      if (message === "no error") result.result = false;
      if (!result.payload) result.payload = {};
      result.payload["type"] = targetPortTensor.elementType?.toString() || "";
    }
    // Later will have to handle the logic for variable length models
    if (targetNode.type === "model") {
      if (
        !_.isEqual(targetPortTensor.dimensions, sourcePortTensor.dimensions)
      ) {
        result.result = true;
        const message = isTensorIncompatible2(
          result.message,
          targetNode.data.label,
          sourcePortTensor.elementType,
          targetPortTensor.elementType,
          sourcePortTensor.dimensions,
          targetPortTensor.dimensions
        );
        result.message = message;
      }
    } else {
      if (
        sourcePortTensor.dimensions.length !==
          targetPortTensor.dimensions.length &&
        targetPortTensor.dimensionType !== "dynamic"
      ) {
        const message = isTensorIncompatible3(
          result.message,
          targetNode.data.label,
          sourcePortTensor.elementType,
          targetPortTensor.elementType,
          sourcePortTensor.dimensions,
          targetPortTensor.dimensions,
          targetPortTensor.dimensionType
        );
        result.message = message;
        result.result = true;
        if (message === "no error") result.result = false;
        if (!result.payload) result.payload = {};
        result.payload["dims"] = targetPortTensor.dimensions.join(", ");
      }
      // else {
      //     for (let i = 0; i < sourcePortTensor.dimensions.length; i++) {
      //       const sourceDimension: Dimension = sourcePortTensor.dimensions[i];
      //       const targetDimension: Dimension = targetPortTensor.dimensions[i];

      //       if (targetDimension == 0) {
      //         // the next node's input port can accept any number of elements in this
      //         // dimension. For example, if it says the accepted shape is "f32[1, 0, 2]",
      //         // I could pass in a "f32[1, 5, 2]" or a "f32[1, 9000, 2]", but not a "f32[2, 2, 2]".
      //         //
      //         // Think of the "0" as a wildcard.
      //         continue;
      //       } else if (targetDimension != sourceDimension) {
      //         const message = isTensorIncompatible4(
      //           result.message,
      //           targetNode.data.label,
      //           sourcePortTensor.elementType,
      //           targetPortTensor.elementType,
      //           sourcePortTensor.dimensions,
      //           targetPortTensor.dimensions,
      //           targetPortTensor.dimensionType
      //         );
      //         result.message = message;
      //         result.result = true;
      //         if (!result.payload) result.payload = {};
      //         result.payload["dims"] = targetPortTensor.dimensions.join(", ");
      //       }
      //     }
      //   }
    }
  }

  return result;
};

export const isPropertyIncompatible1 = (
  message: string,
  label: string,
  acceptedTypes: (ElementType | undefined)[],
  elementType?: ElementType | undefined
): string => {
  if (acceptedTypes.find((type) => type === elementType) === undefined) {
    return `${message} ${label} accepts ('${acceptedTypes.join(
      "','"
    )}') types. You provided ${elementType}`;
  } else return "no error";
};

export const isPropertyIncompatible2 = (
  message: string,
  label: string,
  sourceElementType: ElementType | undefined,
  targetElementType: ElementType | undefined,
  sourceDimensions: Dimension[],
  targetDimensions: Dimension[]
): string => {
  if (!_.isEqual(targetDimensions, sourceDimensions)) {
    return `${message} ${label} accepts ${targetElementType} types with these EXACT! dimensions [${targetDimensions.join(
      ","
    )}]. You provided ${sourceElementType} type with [${sourceDimensions.join(
      ","
    )}]`;
  } else {
    return "no error";
  }
};

export const isPropertyIncompatible3 = (
  message: string,
  label: string,
  sourceElementType: ElementType | undefined,
  targetElementType: ElementType | undefined,
  sourceDimensions: Dimension[],
  targetDimensions: Dimension[]
): string => {
  if (sourceDimensions.length !== targetDimensions.length) {
    return `${message} ${label} accepts ${targetElementType} types with [${targetDimensions.join(
      ","
    )}]. You provided ${sourceElementType} type with [${sourceDimensions.join(
      ","
    )}]`;
  } else {
    return "no error";
  }
};

export const isPropertyIncompatible = (
  connection: Connection | Edge,
  name: string,
  value: string | number,
  diagram: FlowElements,
  components: Record<string, Component>
): TensorValidityResult => {
  const result: TensorValidityResult = {
    message: "Tensor Mismatch:",
    result: false,
  };
  const sourceNode: Node<FlowNodeData> = diagram.nodes.filter(
    (node) => node.id === connection.source
  )[0];
  const targetNode: Node<FlowNodeData> = diagram.nodes.filter(
    (node) => node.id === connection.target
  )[0];
  const sourcePortTensor = sourceNode.data.outputs.filter(
    (port) => port.id === connection.sourceHandle
  )[0].tensor;
  const targetPortTensor = targetNode.data.inputs.filter(
    (port) => port.id === connection.targetHandle
  )[0].tensor;

  if (targetNode.type !== "output") {
    const component = components[targetNode.data.componentID];
    const i = targetNode.data.inputs.findIndex(
      (port) => port.id === connection.targetHandle
    );
    let acceptedTypes = [targetNode.data?.inputs[i].tensor.elementType];

    if (
      component &&
      component.acceptedInputElementTypes &&
      component.acceptedInputElementTypes[i]
    )
      acceptedTypes = component.acceptedInputElementTypes?.[i].elementTypes;

    if (
      acceptedTypes.find((type) => type === sourcePortTensor.elementType) ===
      undefined
    ) {
      const message: string = isPropertyIncompatible1(
        result.message,
        targetNode.data.label,
        acceptedTypes,
        sourcePortTensor.elementType
      );
      result.message = message;
      result.result = true;
      if (!result.payload) result.payload = {};
      result.payload["type"] = targetPortTensor.elementType?.toString() || "";
    }
    if (targetNode.type === "model") {
      if (
        !_.isEqual(targetPortTensor.dimensions, sourcePortTensor.dimensions)
      ) {
        result.result = true;
        const message = isPropertyIncompatible2(
          result.message,
          targetNode.data.label,
          sourcePortTensor.elementType,
          targetPortTensor.elementType,
          sourcePortTensor.dimensions,
          targetPortTensor.dimensions
        );
        result.message = message;
        const s = sourcePortTensor.dimensions;
        if (!result.payload) result.payload = {};
        if (name === "pixel_format") {
          if (
            targetPortTensor.dimensions[3] &&
            value !== targetPortTensor.dimensions[3]
          )
            result.validValue = targetPortTensor.dimensions[3];
        }
        if (name === "width") {
          if (
            targetPortTensor.dimensions[1] &&
            value !== targetPortTensor.dimensions[1]
          )
            result.validValue = targetPortTensor.dimensions[1];
        }
        if (name === "height") {
          if (
            targetPortTensor.dimensions[2] &&
            value !== targetPortTensor.dimensions[2]
          )
            result.validValue = targetPortTensor.dimensions[2];
        }
        if (name === "sample_duration_ms") {
          if (
            targetPortTensor.dimensions[0] &&
            value !== targetPortTensor.dimensions[0]
          )
            result.validValue = targetPortTensor.dimensions[0];
        }
        if (name === "hz") {
          if (
            targetPortTensor.dimensions[0] &&
            value !== targetPortTensor.dimensions[0]
          )
            result.validValue = targetPortTensor.dimensions[0];
        }
        if (name === "n") {
          if (
            targetPortTensor.dimensions[1] &&
            value !== targetPortTensor.dimensions[1]
          )
            result.validValue = targetPortTensor.dimensions[1];
        }
        if (name === "length") {
          if (
            targetPortTensor.dimensions[0] &&
            value !== targetPortTensor.dimensions[0]
          )
            result.validValue = targetPortTensor.dimensions[0];
        }
      }
    } else {
      if (
        sourcePortTensor.dimensions.length !==
        targetPortTensor.dimensions.length
      ) {
        const message = isPropertyIncompatible3(
          result.message,
          targetNode.data.label,
          sourcePortTensor.elementType,
          targetPortTensor.elementType,
          sourcePortTensor.dimensions,
          targetPortTensor.dimensions
        );
        result.message = message;
        result.result = true;
        if (!result.payload) result.payload = {};
        result.validValue = targetPortTensor.elementType;
      }
    }
  }

  return result;
};

export const isConnectionValid = (
  connection: Connection,
  diagram: FlowElements,
  components: Record<string, Component>
): ValidatorResult => {
  let valid = true;
  const messages: ValidatorError[] | undefined = [];
  const result: ValidatorResult = {
    error: messages,
    valid,
    connectOnError: false,
  };

  const sourceNode: Node<FlowNodeData> = diagram.nodes.filter(
    (node) => node.id === connection.source
  )[0];
  const targetNode: Node<FlowNodeData> = diagram.nodes.filter(
    (node) => node.id === connection.target
  )[0];

  //  except serial no input ports can accept multiple edges (should detect on clicking build button - make the node and line noticeable)
  if (isGangbang(connection, targetNode, diagram)) {
    valid = false;
    messages.push({
      code: 2,
      message: "Cannot Connect: Too Many Edges",
      target: {
        type: "edge",
        id: connection.targetHandle || "",
      },
    });
    return {
      ...result,
      error: !valid && messages ? messages : undefined,
      valid,
    };
  }
  /*
        Tried to connect a Node's source and target port
        Covers a subset of the following cases:
            * Inputs can only connect to: PB / Model / Serial (should not connected and show notif)
            * PB can be only connect to: PB / Model / Serial (should not connected and show notif)
            * Model can be only connect to; PB / Model / Serial ( should not connected and show notif)
    */
  if (isSourceTargetSame(connection)) {
    valid = false;
    messages.push({
      code: 1,
      message: "Cannot Connect a Node to Itself",
      target: {
        type: "edge",
        id: connection.targetHandle || "",
      },
    });
    return {
      ...result,
      error: !valid && messages ? messages : undefined,
      valid,
    };
  }

  //TODO: No Cycles allowed (possible with long cycles also) >  (should detect on clicking build button - make the port and line noticeable)
  // if (isCreatingCycle(connection, targetNode, diagram)) {
  //   valid = false;
  //   messages.push({
  //     code: 3,
  //     message: "Cannot Connect: Creating a Cycle",
  //     target: {
  //       type: "edge",
  //       id: connection.targetHandle || ""
  //     }
  //   });
  //   return {
  //     ...result,
  //     error: !valid && messages ? messages : undefined,
  //     valid
  //   };
  // }

  const IsTensorIncompatible = isTensorIncompatible(
    connection,
    diagram,
    components
  );
  if (IsTensorIncompatible.result) {
    valid = false;
    const message: ValidatorError = {
      code: 0,
      message: IsTensorIncompatible.message,
      target: {
        type: "port",
        id: connection.sourceHandle || "",
      },
      payload: IsTensorIncompatible.payload,
    };
    if (message.payload && connection.source && connection.sourceHandle) {
      message.payload["nodeId"] = connection.source;
      message.payload["portId"] = connection.sourceHandle;
    }
    messages.push(message);
    messages.push({
      code: 0,
      message: IsTensorIncompatible.message,
      target: {
        type: "node",
        id: connection.source || "",
      },
    });
    return {
      ...result,
      error: !valid && messages ? messages : undefined,
      valid,
      connectOnError: true,
    };
  }

  return {
    ...result,
    error: undefined,
    valid: true,
  };
};

export const isDiagramValid = (
  diagram: FlowElements,
  components: Record<string, Component>
): ValidatorResult => {
  const validNodes: Record<string, boolean> = {};
  const validPorts: Record<string, boolean> = {};
  diagram.nodes.forEach((node) => {
    validNodes[node.id] = true;
    detectInvalidNodes(node.id, "processing");
    node.data.inputs.forEach((input) => {
      validPorts[input.id] = true;
      detectInvalidNodesPort(input.id, "processing");
    });
    node.data.outputs.forEach((output) => {
      validPorts[output.id] = true;
      detectInvalidNodesPort(output.id, "processing");
    });
  });

  let valid = true;
  const messages: ValidatorError[] | undefined = [];
  const result: ValidatorResult = {
    error: messages,
    valid,
    connectOnError: true,
  };

  const inputPortsNodeMap = generatePortNodeMap("inputs", diagram);
  const outputPortsNodeMap = generatePortNodeMap("outputs", diagram);

  //No orphan nodes allowed (should detect on clicking build button - make the node noticeable)
  if (!everyInputPortHasEdge(inputPortsNodeMap, diagram).valid) {
    valid = false;
    const hints = everyInputPortHasEdge(inputPortsNodeMap, diagram).hintTargets;
    hints?.forEach((target) => {
      validPorts[target] = false;
      messages?.push({
        code: 3,
        message: "Input Port is not connected",
        target: {
          type: "port",
          id: target,
        },
      });
    });
  }
  //Except Inputs >> All nodes Input ports have to have an edge (should detect on clicking build button - make the node noticeable)
  //Except for serial all node outputs need to have and edge (should detect on clicking build button - make the node noticeable)
  // if (!everyOutputPortHasEdge(outputPortsNodeMap, diagram).valid) {
  //   valid = false;
  //   const hints = everyOutputPortHasEdge(
  //     outputPortsNodeMap,
  //     diagram
  //   ).hintTargets;
  //   hints?.forEach(target => {
  //     validPorts[target] = false;
  //     messages?.push({
  //       code: 4,
  //       message: "Output Port is not connected",
  //       target: {
  //         type: "port",
  //         id: target
  //       }
  //     });
  //   });
  // }

  //data formats of input and outputs must be friendly > (should detect on clicking build button - make the ports, nodes and lines noticeable)
  diagram.edges.forEach((edge) => {
    const compatibility = isTensorIncompatible(edge, diagram, components);
    if (compatibility.result) {
      valid = false;
      const message: ValidatorError = {
        code: 0,
        message: compatibility.message,
        target: {
          type: "port",
          id: edge.sourceHandle || "",
        },
        payload: compatibility.payload,
      };
      if (message.payload && edge.source && edge.sourceHandle) {
        validPorts[edge.sourceHandle] = false;
        message.payload["nodeId"] = edge.source;
        message.payload["portId"] = edge.sourceHandle;
      }
      messages.push(message);
      validNodes[edge.source] = false;
      messages.push({
        code: 0,
        message: compatibility.message,
        target: {
          type: "node",
          id: edge.source || "",
        },
      });
    }
  });

  Object.entries(validNodes).forEach(([id, valid]) => {
    if (valid) {
      detectInvalidNodes(id, "valid");
    }
  });
  Object.entries(validPorts).forEach(([id, valid]) => {
    if (valid) {
      detectInvalidNodesPort(id, "valid");
    }
  });

  return {
    ...result,
    error: !valid && messages ? messages : undefined,
    valid: messages && messages.length > 0 ? false : true,
  };
};

export type PropertyValueResult = {
  valid: boolean;
  validValue?: string | number;
};

export const isPropertyValueValid = (
  id: string,
  name: string,
  value: string | number,
  diagram: FlowElements,
  components: Record<string, Component>
): PropertyValueResult => {
  const result: PropertyValueResult = {
    valid: true,
  };
  const node = diagram.nodes.find((node) => node.id === id);
  if (node) {
    const connectedEdges = diagram.edges.filter(
      (edge) => edge.source === node?.id
    );
    if (connectedEdges.length > 0) {
      const payload = isPropertyIncompatible(
        connectedEdges[0],
        name,
        value,
        diagram,
        components
      );
      if (payload.result && payload.validValue) {
        result.valid = false;
        result.validValue = payload.validValue;
      }
    }
  }
  return result;
};

// module.exports = isPropertyIncompatible;
