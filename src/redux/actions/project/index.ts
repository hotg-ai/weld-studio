import { ProjectInfo } from "../../../redux/reducers/builder";
import { AppDispatch, AppStoreState } from "../../../redux/store";
import { RuneCanvas } from "../../../components/Analysis/utils/FlowUtils";
import { ProcBlock } from "@hotg-ai/rune";

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
  procBlocks: Record<string, ProcBlock>;
  diagram?: RuneCanvas;
};

export type Project = NotLoaded | LoadedProject | Loading | LoadingFailed;


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
