import { ProjectInfo } from "../../../redux/reducers/builder";
import { AppDispatch, AppStoreState } from "../../../redux/store";
import { ProcBlockMetadata } from "../../../components/Analysis/model/metadata";
import { RuneCanvas } from "../../../components/Analysis/utils/FlowUtils";
import { BuildInfo, BuildStatus } from "../build";

type NotLoaded = {
  state: "not-loaded";
};

type Loading = {
  state: "loading";
};

type LoadingFailed = {
  state: "failed";
  message: string;
  error?: Error;
};

export type ThunkApiConfig = {
  rejectValue: LoadingFailed;
  dispatch: AppDispatch;
  state: AppStoreState;
};

export type LoadProjectParams = {
  projectName: string;
  projectTemplate: string;
};
export type LoadedProject = {
  state: "loaded";
  info: ProjectInfo;
  procBlocks: Record<string, ProcBlockMetadata>;
  diagram?: RuneCanvas;
  buildLogs?: Record<string, BuildInfo>;
  latestBuild?: BuildStatus;
};

export type Project = NotLoaded | LoadedProject | Loading | LoadingFailed;

export function projectDoesntExist(error: unknown) {
  return (
    error instanceof Error &&
    error.name === "HTTPError" &&
    error.message.includes("404")
  );
}

export function loadingFailed(
  error: unknown,
  defaultMessage: string
): LoadingFailed {
  if (error instanceof Error) {
    return { state: "failed", message: error.message, error };
  } else {
    return { state: "failed", message: defaultMessage };
  }
}
