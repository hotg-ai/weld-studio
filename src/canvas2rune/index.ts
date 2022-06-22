import { dump } from "js-yaml";
import {
  Layer,
  Port,
  Node,
  Link,
  SerializedFlowDiagram,
  SerializedDiagram,
  Model,
  DiagramNode,
  Edge,
} from "./serialized";
import { DocumentV1, ResourceDeclaration, Stage, Type } from "./Runefile";

export const storm2rune = async (
  serialised: SerializedFlowDiagram | SerializedDiagram
): Promise<string> => {
  const graph = new Graph(serialised);

  const version = 1;
  const image = "runicos/base";

  const resources = loadResources(graph);
  const pipeline = loadPipeline(graph);

  // FIXME: This is an abomination and needs to be gotten rid of once we
  // get rid of C++ based rune_vm in the iOS and Android apps
  Object.keys(pipeline).forEach(async (stage) => {
    // console.log("PIPELINE STAGES", stage);
    const pipelineStageArgs = pipeline[stage].args;
    if (pipelineStageArgs) {
      Object.keys(pipelineStageArgs).forEach(async (arg) => {
        const argValue: string = pipelineStageArgs[arg] as string;
        if (typeof argValue === "string" && argValue.startsWith("$")) {
          const resource = resources[argValue.substr(1)];
          const resourcePath = resource["path"] as string;
          const resourceValue =
            resourcePath && isFlowDiagram(serialised) && serialised.name
              ? await loadResourceValue(serialised.name, resourcePath)
              : "";
          pipelineStageArgs[arg] = resourceValue;
        }
      });
    }
  });

  const runefile: DocumentV1 = {
    version,
    image,
    pipeline,
  };

  return dump(runefile);
};

const loadResourceValue = async (
  projectName: string,
  resourcePath: string
): Promise<string> => {
  let text: string = "";
  try {
    const raw = await fetch(
      `https://func.hotg.ai/function/sbfs/project/${projectName}/${resourcePath}`,
      {
        method: "GET",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    text = typeof raw === "string" ? raw : await raw.text();
  } catch (e) {
    console.log(`Error Fetching Resource: ${resourcePath}`);
  }
  return text;
};

function loadResources(graph: Graph): Record<string, ResourceDeclaration> {
  if (!graph.diagram || !graph.diagram.resources) return {};

  const resources: Record<string, ResourceDeclaration> = {};

  for (const [key, value] of Object.entries(graph.diagram.resources)) {
    resources[key] = {
      path: value.path,
      type: value.type,
    };
  }

  return resources;
}

function loadPipeline(graph: Graph): Record<string, Stage> {
  const stages: Record<string, Stage> = {};

  for (const model of graph.nodes) {
    stages[sanitizeName(generateNodeKey(model))] = loadStage(model, graph);
  }

  return stages;
}

function loadStage(node: Node, graph: Graph): Stage {
  switch (node.type) {
    case "capability":
      return {
        capability: node.componentIdentifier,
        outputs: outputNodes(node.ports),
        args: loadArgs(node),
      };

    case "model":
      return {
        model: node.componentIdentifier,
        inputs: inputNodes(node.ports, graph),
        outputs: outputNodes(node.ports),
      };

    case "proc-block":
      return {
        "proc-block": node.componentIdentifier,
        inputs: inputNodes(node.ports, graph),
        outputs: outputNodes(node.ports),
        args: loadArgs(node),
      };

    case "output":
      return {
        out: node.componentIdentifier,
        inputs: inputNodes(node.ports, graph),
      };

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

function generateNodeKey(node: Node): string {
  // return `${node.type}_${node.id}`;
  // console.log("NOOODE ===>>>", node);
  return `${node.label || node.name}`;
}

function generateNodePortKey(node: Node, index: number): string {
  // return `${node.type}_${node.id}.${index}`;
  return `${node.label}.${index}`;
}

function sanitizeName(id: string): string {
  return id.replace(/[- ]/g, "_");
}

function outputNodes(ports: Port[] | undefined): Type[] | undefined {
  return ports?.filter((p) => !p.in).map(outputTensor);
}

function outputTensor(port: Port): Type {
  if (!port.tensor) {
    throw new Error("The output port is missing a tensor type");
  }

  const { elementType, dimensions } = port.tensor;
  return {
    type: elementType,
    dimensions,
  };
}

function inputNodes(
  ports: Port[] | undefined,
  graph: Graph
): string[] | undefined {
  return ports?.filter((p) => p.in).flatMap((p) => inputNodesOfPort(p, graph));
}

function inputNodesOfPort(port: Port, graph: Graph): string[] {
  const result: string[] = [];

  if (isFlowDiagram(graph.diagram)) {
    Object.entries(graph.diagram.links).forEach(([, link]: [string, Edge]) => {
      if (port.id === link.targetHandle) {
        const source = graph.getNodeById(link.source);
        if (!source.ports) {
          throw new Error();
        }
        const index = source.ports
          ?.filter((p) => !p.in)
          .findIndex((p) => p.id === link.sourceHandle);
        if (index < 0) {
          throw new Error();
        }
        result.push(sanitizeName(generateNodePortKey(source, index)));
      }
    });
  } else {
    for (const previous of port.links) {
      const link = graph.getLinkById(previous);

      const source = graph.getNodeById(link.source);
      if (!source.ports) {
        throw new Error();
      }

      const index = source.ports
        ?.filter((p) => !p.in)
        .findIndex((p) => p.id === link.sourcePort);

      if (index < 0) {
        throw new Error();
      }

      result.push(sanitizeName(generateNodePortKey(source, index)));
    }
  }

  return result;
}

function loadArgs(node: Node): { [k: string]: string | number } | undefined {
  return node.propertiesValueMap || {};
}

function isFlowDiagram(
  diagram: SerializedFlowDiagram | SerializedDiagram
): diagram is SerializedFlowDiagram {
  return (diagram as SerializedFlowDiagram).runeCanvasVersion !== undefined;
}

class Graph {
  diagram: SerializedFlowDiagram | SerializedDiagram;

  constructor(diagram: SerializedFlowDiagram | SerializedDiagram) {
    this.diagram = diagram;
  }

  private getLayer(name: string): Layer {
    let models: Record<string, Model | undefined> = {};

    if (name === "diagram-nodes")
      if (!isFlowDiagram(this.diagram)) models = this.diagram.layers[1].models;
      else {
        Object.entries(this.diagram.nodes).forEach(
          ([id, node]: [string, DiagramNode]) => {
            models[id] = {
              type: node.data?.type || "",
              ports: Object.values(node.data?.ports || {}),
              id,
              name: node.data?.name || "",
              componentIdentifier: node.data?.componentIdentifier || "",
              propertiesValueMap: node.data?.propertiesValueMap,
              label: node.data.label,
            };
          }
        );
      }
    if (name === "diagram-links")
      if (!isFlowDiagram(this.diagram)) models = this.diagram.layers[0].models;
      else {
        Object.entries(this.diagram.links).forEach(
          ([id, link]: [string, Edge]) => {
            models[id] = {
              id,
              source: link.source,
              sourcePort: link.sourceHandle,
              target: link.target,
              targetPort: link.targetHandle,
            };
          }
        );
      }

    if (Object.keys(models).length === 0) {
      throw new Error();
    }

    return {
      type: name,
      models,
    };
  }

  get diagramNodes(): Layer {
    return this.getLayer("diagram-nodes");
  }

  get diagramLinks(): Layer {
    return this.getLayer("diagram-links");
  }

  get nodes(): Node[] {
    const nodes: Node[] = [];

    for (const node of Object.values(this.diagramNodes.models)) {
      if (node) {
        nodes.push(node as Node);
      }
    }

    return nodes;
  }

  getNodeById(id: string): Node {
    const node = this.diagramNodes.models[id];
    if (!node) {
      throw new Error();
    }
    return node as Node;
  }

  getLinkById(id: string): Link {
    const model = this.diagramLinks.models[id];
    if (!model) {
      throw new Error();
    }
    return model as Link;
  }
}
