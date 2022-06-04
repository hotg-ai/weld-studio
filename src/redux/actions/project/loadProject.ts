import { createAsyncThunk } from "@reduxjs/toolkit";
import { isMap, isObject, uniqueId } from "lodash";
import pino from "pino";

import {
  RuneCanvas,
  storm2flow,
} from "../../../components/Analysis/utils/FlowUtils";
import {
  LoadedProject,
  loadingFailed,
  LoadProjectParams,
  projectDoesntExist,
  ThunkApiConfig,
} from ".";
import { BuildInfo, BuildStatus } from "../build";
import { JobSchema } from "@gitbeaker/core/dist/types/types";
import { v4 as uuid } from "uuid";

import * as projectJson from "../../../data/base.json";
import { ProjectInfo } from "../../../redux/reducers/builder";
import { ProcBlock, Metadata } from "@hotg-ai/rune";
import { invoke } from "@tauri-apps/api/tauri";

export const loadProject = createAsyncThunk<
  LoadedProject,
  LoadProjectParams,
  ThunkApiConfig
>("builder/loadProject", async (args, thunkApi) => {
  const { projectName, projectTemplate } = args;
  const {
    builder: { credentials, s3DownloadURL },
  } = thunkApi.getState();

  // if (!forgeBuilder || !credentials) {
  //   return thunkApi.rejectWithValue({
  //     state: "failed",
  //     message: "No credentials"
  //   });
  // }

  // const projectIdentifier = `${credentials.username}/${projectName}`;

  const projectIdentifier = "";
  const baseURL = `https://func.hotg.ai/function/sbfs/pb`;
  if (!baseURL) {
    throw new Error("The $REACT_APP_ASSETS_BASE_URL variable is not set.");
  }
  const procBlocks = loadProcBlocks();

  try {
    // const raw = await fetch(`${process.env.REACT_APP_AUTH0_REDIRECT_URI}/project/base.json`, { mode: 'no-cors' });

    const project: ProjectInfo = {
      name: projectName,
      id: uuid(),
      path: "",
      ownerId: 0,
      templateName: "",
      url: `https://func.hotg.ai/function/sbfs/project/${projectName}/rune_canvas.json`,
    };
    // Note: gitlab actually sends back a string, but their typing files lie.

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

    //const json = JSON.stringify(projectJson);

    const document = JSON.parse(json);
    if (document.error && document.error === "not found") throw new Error();

    let diagram: RuneCanvas;
    if (
      (document as RuneCanvas & { version: string }).version === undefined &&
      (document as RuneCanvas).runeCanvasVersion === undefined
    ) {
      // Project Storm
      diagram = storm2flow(project, document);
    } else {
      // React Flow
      diagram = document as RuneCanvas;
    }
    const jobs: JobSchema[] = [];

    let latestBuild: BuildStatus | undefined = undefined;
    const validJobs = jobs;

    // if (!s3DownloadURL && validJobs.length > 0) {
    //   const lastJob: any & { finished_at: string; status: string } = validJobs[0];
    //   const finishedAt = moment(lastJob.finished_at);
    //   let s3DownloadUrl: string | undefined;
    //   let running = lastJob.status === "pending" || lastJob.status === "running";
    //   try {
    //     if (lastJob.status === "success") {
    //       s3DownloadUrl = await forgeBuilder.getBuiltRuneUrl(project, lastJob.id)
    //     }
    //   } catch {
    //     running = true;
    //   }
    //   latestBuild = {
    //     id: lastJob.id,
    //     commitId: lastJob.commit.id,
    //     expired: (moment().diff(finishedAt, 'days', true) >= 7),
    //     s3DownloadUrl,
    //     running,
    //     createdAt: moment(lastJob.created_at).toISOString() //moment cannot be serialized in redux
    //   }
    //   // TODO: If pending load state to render building etc @binaryanthems need help here
    // }
    const buildLogs: Record<string, BuildInfo> = {};
    // jobs?.forEach(async (job) => {
    //   buildLogs[job.id] = {
    //     logs: job.status === "pending" || job.status === "running" ? [
    //       { id: moment(job.created_at).toISOString(), method: "warn", data: ["Job is still running. Please refresh to see success."] }
    //     ] : [],
    //     startTimestamp: moment(job.started_at || job.created_at).toISOString(),
    //     //@aminhotg please support these colors in build history tab
    //     status: job.status === "success" ? "error" : job.status === "pending" ? "warning" : job.status === "fail" ? "error" : "info"
    //   };

    // });
    return {
      state: "loaded",
      info: project,
      diagram,
      buildLogs,
      latestBuild,
      procBlocks: await procBlocks,
    };
  } catch (error) {
    console.log(error);
    // if (!projectDoesntExist(error)) {
    //   return thunkApi.rejectWithValue(
    //     loadingFailed(error, "Unable to retrieve the project info")
    //   );
    // }
  }

  try {
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
        method: "POST",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectJson),
      }
    );
    const diagram: RuneCanvas = JSON.parse(JSON.stringify(projectJson));

    return {
      state: "loaded",
      info: project,
      diagram,
      procBlocks: await procBlocks,
    };
  } catch (error) {
    return thunkApi.rejectWithValue(
      loadingFailed(error, "Unable to create a new project")
    );
  }
});

/**
 * Load all known proc-blocks from the backend and extract their metadata.
 *
 */
export async function loadProcBlocks(): Promise<Record<string, ProcBlock>> {
  const procBlocks: Record<string, ProcBlock> = {};

  const allProckBlocks: any[] = await invoke("known_proc_blocks");
  const promises = allProckBlocks.map(async (pb) => {
    try {
      procBlocks[pb["name"]] = await loadProcBlock(pb["publicUrl"]);
    } catch (e) {
      console.log(`Didn't load proc-block ${pb["publicUrl"]} `, e);
    }
  });
  await Promise.all(promises);
  return procBlocks;
}

export async function loadProcBlock(filename: string): Promise<ProcBlock> {
  const url = `${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    const { status, statusText } = response;
    throw new Error(`Unable to retrieve ${filename}: ${status} ${statusText}`);
  }
  const wasm = await response.arrayBuffer();
  const logger = pino({ browser: { write: console.log } });
  const pb = await ProcBlock.load(wasm, logger);
  return pb;
}

async function readManifest(baseURL: string): Promise<string[]> {
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
}

const readMetadata = async (): Promise<Record<string, Metadata>> => {
  const response = await fetch(
    `https://func.hotg.ai/function/sbfs/pb/metadata.json`
  );

  if (!response.ok) {
    const { status, statusText } = response;
    throw new Error(`${status} ${statusText}`);
  }

  const body: Record<string, Metadata> = await response.json();

  if (!isObject(body)) {
    throw new Error("Unable to parse the manifest file");
  }

  return body;
};

export function isStringArray(item?: any): item is string[] {
  return Array.isArray(item) && item.every((elem) => typeof elem == "string");
}
