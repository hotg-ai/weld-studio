import { builtinComponents, Component } from "../components/Analysis/model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WritableDraft } from "immer/dist/types/types-external";
import { Message } from "console-feed/lib/definitions/Component";
import { LoadedProject, Project } from "./actions/project";
import { BuildInfo } from "./actions/build";
import { loadProject } from "./actions/project/loadProject";
import { saveProject } from "./actions/project/saveProject";
import { cancelBuild } from "./actions/build/cancelBuild";
import { deleteProject } from "./actions/project/deleteProject";
import { getBuildLogs } from "./actions/build/getBuildLogs";
import { pollBuildStatus } from "./actions/build/pollBuildStatus";
import { listProjects } from "./actions/project/listProjects";
import { uploadModel } from "./actions/studio/uploadModel";
import { uploadWordlist } from "./actions/studio/uploadWordlist";
import { deployProject } from "./actions/project/deployProject";
import { loadBuildLogs } from "./actions/build/loadBuildLogs";
import { forgeLoggerParams } from "./models/logs";
import { metadataToComponent } from "../components/Analysis/model/metadata";
import _ from "lodash";
import { ResourceDeclaration } from "../components/Analysis/model/Storm";
import { ProjectInfo } from "./reducers/builder";

const RANDOM_BASE = 100000000;

export type SelectedNode = {
  id: string;
};

export type GitlabCredentials = {
  foundry_personal_access_token: string;
  email: string;
  username: string;
};

export type EditNodeProperties = {
  type: "SELECT_NODE";
  selected: SelectedNode;
};
export interface ErrorMessage {
  errorMessage: string;
}

export type EditNodeParams = {
  selected: SelectedNode;
};

export type OnboardingState = {
  active: boolean;
  authenticated: boolean;
  accessToken?: string;
};
export interface builderState {
  selected?: SelectedNode;
  credentials?: GitlabCredentials;
  project: Project;
  currentBuildSHA?: string;
  lastLogSHA?: string;
  lastSuccesfullyBuiltBuild?: string;
  buildInProgress: boolean;
  saveInProgress: boolean;
  components: Record<string, Component>;
  resources: Record<string, ResourceDeclaration>;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  finishedJobId?: number;
  finishedJobLogs: string;
  s3DownloadURL?: string;
  forgeLogs: Message[];
  depIds?: any;
  projectDetails?: ProjectInfo;
  buildLogs: Record<string, BuildInfo>;
  onboardingState: OnboardingState;
  startProgressBarAt: number;
  refreshDimensions: boolean;
}

export const initialState: builderState = {
  selected: undefined,
  credentials: undefined,
  project: { state: "not-loaded" },
  currentBuildSHA: undefined,
  lastLogSHA: undefined,
  lastSuccesfullyBuiltBuild: undefined,
  buildInProgress: false,
  saveInProgress: false,
  components: builtinComponents(),
  resources: {},
  s3DownloadURL: undefined,
  finishedJobId: undefined,
  finishedJobLogs: "",
  forgeLogs: [
    {
      id: "0",
      method: "debug",
      data: ["🔥🔥🔥 Firing up the Furnace!! 🔥🔥🔥"],
    },
  ],
  depIds: undefined,
  projectDetails: undefined,
  buildLogs: {},
  onboardingState: {
    active: false,
    authenticated: false,
  },
  startProgressBarAt: 0,
  refreshDimensions: false,
};

export const builderSlice = createSlice({
  name: "builder",
  initialState,
  reducers: {
    // SetForgeCredentials: (state, action) => {
    //   const { credentials, forgeBuilder } = action.payload;
    //   return {
    //     ...state,
    //     forgeBuilder,
    //     credentials,
    //   };
    // },
    ClearSelectedNode: (state: WritableDraft<builderState>) => {
      return {
        ...state,
        selected: undefined,
      };
    },
    SelectNode: (
      state: WritableDraft<builderState>,
      action: PayloadAction<SelectedNode | undefined>
    ) => {
      return {
        ...state,
        selected: action.payload,
      };
    },
    Log: (state: builderState, action: PayloadAction<forgeLoggerParams>) => {
      state.forgeLogs.push({
        id: `${new Date()
          .getTime()
          .toString()}-${action.payload.message.length.toString()}`, // Need to do better than ...prevState.logs.length
        method: action.payload.type,
        data: [new Date().toLocaleString(), action.payload.message],
      });
    },
    // ResetStudioState: (state: builderState) => {
    //   const { credentials, projectsList, components } = state;
    //   return {
    //     ...initialState,
    //     credentials,
    //     projectsList,
    //     components,
    //   };
    // },
    SetOnboardingCredentials: (
      state: builderState,
      action: PayloadAction<OnboardingState>
    ) => {
      return {
        ...state,
        onboardingState: action.payload,
      };
    },
    SetProgressBarPercentage: (
      state: builderState,
      action: PayloadAction<number>
    ) => {
      return {
        ...state,
        startProgressBarAt: action.payload,
      };
    },
    RefreshDimensions: (state: builderState) => {
      return {
        ...state,
        refreshDimensions: !state.refreshDimensions,
      };
    },
    ClearComponents: (state: builderState) => {
      return {
        ...state,
        components: {},
      };
    },
    UpdateComponents: (
      state: builderState,
      action: PayloadAction<Record<string, Component>>
    ) => {
      return {
        ...state,
        components: {
          ...state.components,
          ...action.payload,
        },
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProject.pending, (state) => {
        state.project = { state: "loading" };
      })
      .addCase(
        loadProject.fulfilled,
        (
          state: WritableDraft<builderState>,
          action: PayloadAction<LoadedProject>
        ) => {
          state.project = action.payload;
          state.projectDetails = action.payload.info;
          if (action.payload.diagram?.resources)
            state.resources = action.payload.diagram?.resources;

          // const procBlocks = Object.entries(state.project.procBlocks).map(
          //   ([name, meta]) =>
          //     [
          //       `proc-block/${_.camelCase(name)}`,
          //       metadataToComponent(name, meta),
          //     ] as const
          // );

          state.components = {
            ...builtinComponents(),
            // ...Object.fromEntries(procBlocks),
            ...action.payload.diagram?.components,
          };
          if (action.payload.buildLogs)
            state.buildLogs = action.payload.buildLogs;

          if (
            !state.s3DownloadURL &&
            !state.finishedJobId &&
            !action.payload.latestBuild?.expired
          ) {
            state.s3DownloadURL = action.payload.latestBuild?.s3DownloadUrl;
            state.finishedJobId = action.payload.latestBuild?.id;
          }
        }
      )
      .addCase(saveProject.pending, (state) => {
        const message = "Saving & Building Project ...";
        state.forgeLogs = [
          {
            id: `${new Date().getTime().toString()}-${Math.floor(
              Math.random() * RANDOM_BASE
            )}-${state.forgeLogs.length}`, // Need to do better than ...prevState.logs.length
            method: "info",
            data: [new Date().toLocaleString(), message],
          },
        ];
        state.finishedJobId = undefined;
      })
      .addCase(loadProject.rejected, (state, action) => {
        if (action.payload) {
          state.project = action.payload;
        } else {
          state.project = {
            state: "failed",
            message: action.error.message || "Unknown error occurred",
          };
        }
      })
      .addCase(saveProject.fulfilled, (state, action) => {
        state.buildInProgress = true;
        state.currentBuildSHA = action.payload;
        state.lastLogSHA = undefined;
        state.lastSuccesfullyBuiltBuild = undefined;
        state.finishedJobId = undefined;
      })
      .addCase(saveProject.rejected, (state) => {
        state.buildInProgress = false;
        state.lastLogSHA = undefined;
        state.currentBuildSHA = undefined;
        state.finishedJobId = undefined;
      })
      // .addCase(listProjects.fulfilled, (state, action) => {
      //   state.projectsList = action.payload;
      // })
      // .addCase(listProjects.rejected, (state) => {
      //   state.projectsList = [];
      // })
      .addCase(uploadModel.fulfilled, (state, action) => {
        const { key, model } = action.payload;
        state.components[key] = model;
      })
      .addCase(uploadModel.rejected, (state, action) => {
        // TODO: Handle this properly by showing a toast message or something
        // eslint-disable-next-line
        console.error("Upload failed", action);

        const message =
          "Failed to upload model please check your model is tflite.";
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`, // Need to do better than ...prevState.logs.length
          method: "error",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(uploadWordlist.pending, (state) => {
        const message = "Starting Upload of Wordlist File";
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`,
          method: "info",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(uploadWordlist.fulfilled, (state, action) => {
        const { key, resources } = action.payload;
        state.resources[key] = resources;
        const message = "Label Wordlist Upload Successful";
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`,
          method: "info",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(uploadWordlist.rejected, (state, action) => {
        // TODO: Handle this properly by showing a toast message or something
        // eslint-disable-next-line
        console.error("Upload wordlist failed", action);

        const message = "Label Wordlist Upload Failed";
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`,
          method: "error",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(pollBuildStatus.fulfilled, (state, action) => {
        state.finishedJobId = action.payload.jobId;
        state.s3DownloadURL = action.payload.s3Url;
        state.buildInProgress = false;
        state.lastSuccesfullyBuiltBuild = state.currentBuildSHA;
        const message = "Cooling down the rune ...";
        if (action.payload.jobId) {
          if (state.buildLogs[action.payload.jobId]) {
            state.forgeLogs.push({
              id: `${new Date().getTime().toString()}-${Math.floor(
                Math.random() * RANDOM_BASE
              )}`, // Need to do better than ...prevState.logs.length
              method: "info",
              data: [new Date().toLocaleString(), message],
            });
            state.buildLogs[action.payload.jobId.toString()].logs.push({
              id: `${new Date().getTime().toString()}-${Math.floor(
                Math.random() * RANDOM_BASE
              )}`, // Need to do better than ...prevState.logs.length
              method: "info",
              data: [new Date().toLocaleString(), message],
            });
          } else {
            state.buildLogs[action.payload.jobId] = {
              logs: [],
              startTimestamp: new Date().toLocaleString(),
              status: "success",
            };
          }
          if (action.payload.s3Url) {
            state.buildLogs[action.payload.jobId].testurl = state.s3DownloadURL;
            state.forgeLogs.push({
              id: `${new Date().getTime().toString()}-${Math.floor(
                Math.random() * RANDOM_BASE
              )}`, // Need to do better than ...prevState.logs.length
              method: "result",
              data: [
                new Date().toLocaleString(),
                `Rune built! ${state.s3DownloadURL}`,
              ],
            });
            state.buildLogs[action.payload.jobId].logs.push({
              id: `${new Date().getTime().toString()}-${Math.floor(
                Math.random() * RANDOM_BASE
              )}`, // Need to do better than ...prevState.logs.length
              method: "result",
              data: [
                new Date().toLocaleString(),
                `Rune built! ${state.s3DownloadURL}`,
              ],
            });
          }
        }
      })
      .addCase(pollBuildStatus.pending, (state) => {
        const message = "🔨 Swinging the hammers 🔨";
        state.buildInProgress = true;
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`, // Need to do better than ...prevState.logs.length
          method: "info",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(pollBuildStatus.rejected, (state) => {
        state.finishedJobId = undefined;
      })
      .addCase(getBuildLogs.fulfilled, (state, action) => {
        if (action.payload.message)
          if (action.payload.message.data.length > 1) {
            action.payload.message.data.forEach((log) => {
              if (action.payload.message) {
                state.forgeLogs.push({
                  id: `${new Date().getTime().toString()}-${Math.floor(
                    Math.random() * RANDOM_BASE
                  )}`,
                  method: action.payload.message.method,
                  data: [log],
                });
                if (state.buildLogs[action.payload.jobId])
                  state.buildLogs[action.payload.jobId].logs.push({
                    id: `${new Date().getTime().toString()}-${Math.floor(
                      Math.random() * RANDOM_BASE
                    )}`,
                    method: action.payload.message.method,
                    data: [log],
                  });
                else
                  state.buildLogs[action.payload.jobId] = {
                    logs: [],
                    startTimestamp: new Date().toLocaleString(),
                    status:
                      action.payload.message.method === "info"
                        ? "success"
                        : "error",
                    testurl: undefined,
                  };
              }
            });
          } else {
            state.forgeLogs.push(action.payload.message);
          }
        state.lastLogSHA = state.currentBuildSHA;
        state.buildInProgress = false;
      })
      .addCase(getBuildLogs.rejected, (state) => {
        state.finishedJobLogs = "";
        state.buildInProgress = false;
      })
      // .addCase(deleteProject.fulfilled, (state, action) => {
      //   state.projectsList = action.payload;
      // })
      .addCase(cancelBuild.fulfilled, (state) => {
        state.buildInProgress = false;
      })
      .addCase(deployProject.fulfilled, (state, action) => {
        state.depIds = action.payload;

        const message = "Deployed rune succesfully";
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`,
          method: "info",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(deployProject.rejected, (state) => {
        state.depIds = undefined;

        const message = "Unable to deploy the rune";
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`,
          method: "error",
          data: [new Date().toLocaleString(), message],
        });
      })
      .addCase(loadBuildLogs.fulfilled, (state, action) => {
        state.buildLogs[action.payload.jobId].logs = action.payload.logs;
      })
      .addCase(loadBuildLogs.rejected, (state) => {
        state.forgeLogs.push({
          id: `${new Date().getTime().toString()}-${Math.floor(
            Math.random() * RANDOM_BASE
          )}`,
          method: "error",
          data: ["Error Fetching Logs for Build"],
        });
      });
  },
});
export const {
  // SetForgeCredentials,
  SelectNode,
  Log,
  // ResetStudioState,
  ClearSelectedNode,
  SetOnboardingCredentials,
  SetProgressBarPercentage,
  RefreshDimensions,
  ClearComponents,
  UpdateComponents,
} = builderSlice.actions;
export default builderSlice.reducer;
