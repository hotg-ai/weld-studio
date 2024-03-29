import { builtinComponents, Component } from "../components/Analysis/model";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WritableDraft } from "immer/dist/types/types-external";
import { Message } from "console-feed/lib/definitions/Component";
import { Project } from "./actions/project";
import { uploadModel } from "./actions/studio/uploadModel";
import { ResourceDeclaration } from "../components/Analysis/model/Legacy";
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
  components: Record<string, Component>;
  resources: Record<string, ResourceDeclaration>;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  forgeLogs: Message[];
  projectDetails?: ProjectInfo;
  refreshDimensions: boolean;
}

export const initialState: builderState = {
  selected: undefined,
  credentials: undefined,
  project: {
    state: "loaded",
    info: { id: "", name: "", ownerId: 0, path: "", templateName: "", url: "" },
    procBlocks: {},
  },
  components: builtinComponents(),
  resources: {},
  forgeLogs: [
    {
      id: "0",
      method: "debug",
      data: ["🔥🔥🔥 Firing up the Furnace!! 🔥🔥🔥"],
    },
  ],
  projectDetails: undefined,
  refreshDimensions: false,
};

export const builderSlice = createSlice({
  name: "builder",
  initialState,
  reducers: {
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
          ...action.payload,
        },
      };
    },
    RefreshComponents: (
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
      });
  },
});
export const {
  SelectNode,
  ClearSelectedNode,
  RefreshDimensions,
  ClearComponents,
  UpdateComponents,
  RefreshComponents,
} = builderSlice.actions;
export default builderSlice.reducer;
