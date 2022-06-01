import { isStringArray } from "../../../redux/actions/project/loadProject";
import { pino } from "pino";

import {
  CanvasLink,
  CanvasNode,
  RuneCanvas,
  storm2flow,
} from "../utils/FlowUtils";
import { isMap, isObject, uniqueId } from "lodash";
import { ProcBlockMetadata } from "./metadata";
import { v4 as uuid } from "uuid";
import { ProjectInfo } from "../../../redux/reducers/builder";

// import { load } from "./runtime";
import * as rt from "./bindings/runtime-v1";

import { Port } from "./Storm";
import { Tensor } from ".";

import { ProcBlock } from "@hotg-ai/rune";
const loadProject = async (projectName: string): Promise<RuneCanvas> => {
  const project: ProjectInfo = {
    name: projectName,
    id: uuid(),
    path: "",
    ownerId: 0,
    templateName: "",
    url: `https://func.hotg.ai/function/sbfs/project/${projectName}/rune_canvas.json`,
  };

  const raw = await fetch(
    `https://func.hotg.ai/function/sbfs/project/${projectName}/rune_canvas.json`,
    {
      method: "GET",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const json = typeof raw === "string" ? raw : await raw.text();
  const document = JSON.parse(json);
  if (document.error && document.error === "not found") throw new Error();
  let diagram: RuneCanvas;
  if (
    (document as RuneCanvas & { version: string }).version === undefined &&
    (document as RuneCanvas).runeCanvasVersion === undefined
  ) {
    diagram = storm2flow(project, document);
  } else {
    diagram = document as RuneCanvas;
  }
  return diagram;
};

const readManifest = async (): Promise<string[]> => {
  const response = await fetch(
    `https://func.hotg.ai/function/sbfs/pb/manifest.json`
  );

  if (!response.ok) {
    const { status, statusText } = response;
    throw new Error(`${status} ${statusText}`);
  }

  const body = await response.json();

  if (!isStringArray(body)) {
    throw new Error("Unable to parse the manifest file");
  }

  return body;
};

const readMetadata = async (): Promise<Record<string, ProcBlockMetadata>> => {
  const response = await fetch(
    `https://func.hotg.ai/function/sbfs/pb/metadata.json`
  );

  if (!response.ok) {
    const { status, statusText } = response;
    throw new Error(`${status} ${statusText}`);
  }

  const body: Record<string, ProcBlockMetadata> = await response.json();

  if (!isObject(body)) {
    throw new Error("Unable to parse the manifest file");
  }

  return body;
};

function generateDummyInputs(project: RuneCanvas) {
  throw new Error("Function not implemented.");
}

export const executeLocally = async (
  project: RuneCanvas,
  inputs: any
): Promise<Record<string, rt.Tensor> | undefined> => {
  const manifest = await readManifest();
  const metadata = await readMetadata();
  if (project.nodes) {
    Object.entries(project.nodes).forEach(
      async ([id, node]: [string, CanvasNode]) => {
        if (node.data.type === "proc-block") {
          const name = node.data.componentIdentifier.split("#")[1];
          const response = await fetch(
            `https://func.hotg.ai/function/sbfs/pb/${name}.wasm`
          );
          const evaluate = await ProcBlock.load(response, pino());

          const samples = new Float64Array([100, 200, 300]);
          const tensor: rt.Tensor = {
            elementType: rt.ElementType.F64,
            dimensions: new Uint32Array([samples.length]),
            buffer: new Uint8Array(samples.buffer),
          };
          /**
           *
           * { input: tensor } for Softmax
           * { samples: tensor } for stats, median
           */
          let x;
          try {
            x = evaluate.evaluate({}, {});
          } catch (e) {
            x = evaluate.evaluate({}, {});
          }
        }
      }
    );
  }
  return undefined;
};

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

export const getOutputs = (diagram: RuneCanvas): Tensor[][] => {
  let result: Tensor[][] = [];
  Object.entries(diagram.nodes).forEach(([id, node]: [string, CanvasNode]) => {
    if (node.data.type === "output") {
      const n = getSourceNode(diagram, node.data.id);
      let outputs: Tensor[] = [];
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

export const execute = async (projectName: string, Inputs: any) => {
  const project = await loadProject(projectName);
  //   const inputs = await generateDummyInputs(project);
  const result = await executeLocally(project, {});
  return result;
};
