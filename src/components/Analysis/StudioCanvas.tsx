import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuid } from "uuid";
import {
  Component,
  modelProperties,
  outputProperties,
  Property,
  PropertyValues,
  TensorDescriptionModel,
} from "./model";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import {
  builderState,
  ClearSelectedNode,
  SelectNode,
} from "../../redux/builderSlice";
import ReactFlow, {
  Controls,
  Position,
  addEdge,
  Connection,
  Edge,
  Node,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowInstance,
  ConnectionMode,
  EdgeChange,
} from "react-flow-renderer";
import { FlowNodeData, FlowNodeComponent } from "./model/FlowNodeComponent";
import CustomEdge from "./CustomEdge";
import { QueryData } from "src/types";
import { AnyAction, Dispatch, ThunkDispatch } from "@reduxjs/toolkit";
import { FlowElements } from "src/redux/reactFlowSlice";

type OwnProps = {
  datasetRegistry: Record<string, QueryData>;
};

function componentProperties(component: Component): Record<string, Property> {
  switch (component.type) {
    case "capability":
    case "proc-block":
      return component.properties;
    case "model":
      return modelProperties;
    case "output":
      return outputProperties;
    default:
      throw new Error(
        "Typescript makes sure this is unreachable, but eslint insists on the branch anyway 🤷"
      );
  }
}

export function defaultPropertyValues(
  component: Component
): Record<string, string | number> {
  const values: Record<string, string | number> = {};
  const properties = componentProperties(component);

  for (const [name, property] of Object.entries(properties)) {
    values[name] = property.defaultValue;
  }
  return values;
}

export function inputs(component: Component): TensorDescriptionModel[] {
  switch (component.type) {
    case "capability":
      return [];
    case "model":
      return component.inputs;
    case "proc-block":
      // TODO: Proc-blocks can be generic over their inputs, so we should
      // probably do something smarter here
      return component.exampleInputs;
    case "output":
      // TODO: figure out how to represent "any tensor"
      return component.exampleInputs;
  }
}

export function outputs(
  component: Component,
  propertyValues: PropertyValues
): TensorDescriptionModel[] {
  switch (component.type) {
    case "capability":
      return component.outputs(propertyValues);
    case "model":
      return component.outputs;
    case "proc-block":
      // TODO: Compute this using component.outputs()
      return component.exampleOutputs;
    default:
      return [];
  }
}

export default function StudioCanvas({ datasetRegistry }: OwnProps) {
  const [canvasNodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [canvasEdges, setEdges] = useState<Edge<undefined>[]>([]);
  //console.log(canvasEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const diagram = useAppSelector((e) => e.flow);

  const [reactFlowInstance, setReactFlowInstance] = useState<
    ReactFlowInstance | undefined
  >(undefined);

  const components = useAppSelector((s) => s.builder.components);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(ClearSelectedNode());
    setNodes(diagram.nodes);
    setEdges(diagram.edges);
  }, [datasetRegistry]);

  // We ned to clear selection so that we can see the properties panel showing the
  useEffect(() => {
    dispatch(ClearSelectedNode());
  }, [dispatch]);

  /*
    React Flow Props
  */
  const nodeTypes = useMemo(
    () => ({
      capability: FlowNodeComponent,
      model: FlowNodeComponent,
      "proc-block": FlowNodeComponent,
      output: FlowNodeComponent,
    }),
    []
  );

  const connectionLineStyle = { stroke: "#333", strokeWidth: 4 };

  const onInit = (reactFlowInstance: ReactFlowInstance) => {
    setReactFlowInstance(reactFlowInstance);
  };

  const removeNode = async (nodes: Node<FlowNodeData>[]) => {
    await dispatch(ClearSelectedNode());
    nodes.forEach(async (node) => {
      await dispatch({ type: "DELETE_NODE", payload: node.id });
    });
  };

  const removeEdge = async (edges: Edge<undefined>[]) => {
    await dispatch(ClearSelectedNode());
    edges.forEach(async (edge) => {
      await dispatch({ type: "DELETE_EDGE", payload: edge.id });
    });
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      const id = uuid();
      setEdges((edges) => {
        console.log("ADDING", edges);
        return addEdge(
          { ...connection, id, animated: true, type: "custom" },
          edges
        );
      });
      dispatch({
        type: "ADD_EDGE",
        payload: addEdge(
          { ...connection, id, animated: true, type: "custom" },
          [...diagram.edges]
        ).slice(-1)[0],
      });
    },
    [dispatch, diagram.edges]
  );

  const onNodeDragStop = (
    event: React.MouseEvent<Element, MouseEvent>,
    node: Node<FlowNodeData>
  ) => {
    dispatch({ type: "REPOSITION_NODE", payload: node });
  };

  const onDrop = async (
    event: React.DragEvent,
    components: Record<string, Component | undefined>,
    dispatch: ThunkDispatch<
      {
        builder: builderState;
        flow: FlowElements;
      },
      undefined,
      AnyAction
    > &
      Dispatch<AnyAction>
  ) => {
    event.preventDefault();
    if (reactFlowWrapper && reactFlowWrapper.current && reactFlowInstance) {
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      if (event.dataTransfer) {
        const componentID: string =
          event.dataTransfer.getData("forge-node-dragged");
        const component = components[componentID];
        if (component) {
          const nodeId: string = uuid();
          const data: Node<FlowNodeData> = {
            id: nodeId,
            position: position,
            type: component.type,
            data: {
              componentID,
              name: component.displayName,
              type: component.type,
              label: component.displayName,
              inputs: [],
              outputs: [],
              inputPorts: [],
              outputPorts: [],
              componentIdentifier: component.identifier,
              propertiesValueMap: defaultPropertyValues(component),
            },
          };
          if (component.type === "capability") {
            let count = 0;
            canvasNodes.forEach((node) => {
              if (node.type === "capability") count++;
            });
            data.data.propertiesValueMap["source"] = count;
          }
          switch (component.type) {
            case "capability":
              data.sourcePosition = Position.Right;
              break;
            case "output":
              data.targetPosition = Position.Left;
              break;
            default:
              data.sourcePosition = Position.Right;
              data.targetPosition = Position.Left;
              break;
          }
          inputs(component).forEach((tensor, idx) => {
            const name =
              tensor.displayName || `${component.displayName} input ${idx + 1}`;
            const id = uuid();
            data.data?.inputs.push({
              id,
              idx,
              name,
              tensor: tensor,
              type: "",
              alignment: "left",
              in: true,
              label: name,
            });
            data.data?.inputPorts.push();
          });
          if (data.data?.propertiesValueMap)
            outputs(component, data.data?.propertiesValueMap).forEach(
              (tensor, idx) => {
                const name =
                  tensor.displayName ||
                  `${component.displayName} output ${idx + 1}`;
                const id = uuid();
                data.data?.outputs.push({
                  id,
                  idx,
                  name,
                  tensor: tensor,
                  type: "",
                  alignment: "left",
                  in: true,
                  label: name,
                });
              }
            );
          await dispatch({ type: "ADD_NODE", payload: data });
          setNodes([...canvasNodes, data]);
          await dispatch(SelectNode({ id: nodeId }));
        }
      }
    }
  };

  const onNodeClick = async (
    event: React.MouseEvent<Element, MouseEvent>,
    node: Node<any>
  ) => {
    //@ts-ignore
    if (event.target.className === "nodeDelete_btn") return;
    event.stopPropagation();
    event.preventDefault();
    await dispatch(ClearSelectedNode());
    if (node && node.position) await dispatch(SelectNode({ id: node.id }));
  };

  const onEdgeClick = async (
    event: React.MouseEvent<Element, MouseEvent>,
    edge: Edge<undefined>
  ) => {
    await dispatch(ClearSelectedNode());
    event.stopPropagation();
    event.preventDefault();
  };

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nodes) => {
        const newNodes = applyNodeChanges(changes, nodes);
        // dispatch({ type: "SET_NODES", payload: newNodes});
        return newNodes;
      });
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((edges) => {
        const newEdges = applyEdgeChanges(changes, edges);
        // dispatch({ type: "SET_EDGES", payload: newEdges});
        return newEdges;
      });
    },
    [setEdges]
  );

  const reactFlowNode = document.querySelector(".react-flow__nodes")!;
  if (reactFlowNode) {
    reactFlowNode.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    }); //for prevent right click on mac devices on selecting multiple nodes
  }

  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  return (
    <div
      ref={reactFlowWrapper}
      className="StudioBody--canvas_container"
      style={{
        height: "100%",
        left: "0",
        top: "0",
        width: "100%",
      }}
    >
      <ReactFlow
        fitView
        fitViewOptions={{ padding: 20 }}
        nodesDraggable={true}
        elementsSelectable={true}
        connectionMode={ConnectionMode.Strict}
        connectionLineStyle={connectionLineStyle}
        nodeTypes={nodeTypes}
        onInit={onInit}
        nodes={canvasNodes}
        edges={canvasEdges}
        onConnect={onConnect}
        onPaneClick={(e) => {
          dispatch(ClearSelectedNode());
        }}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        selectionKeyCode={"Control"}
        deleteKeyCode={"Backspace"}
        multiSelectionKeyCode={"Shift"}
        onNodesDelete={removeNode}
        onEdgesDelete={removeEdge}
        onDrop={async (e) => {
          await onDrop(e, components, dispatch);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onNodesChange={onNodesChange} // update local state
        onEdgesChange={onEdgesChange} // update local state
        onNodeDragStop={onNodeDragStop} // update redux
        attributionPosition={"bottom-left"}
        edgeTypes={edgeTypes}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}
