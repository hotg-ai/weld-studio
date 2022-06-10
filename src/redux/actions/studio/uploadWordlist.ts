import { createAsyncThunk } from "@reduxjs/toolkit";
import { ResourceDeclaration } from "../../../components/Analysis/model/Storm";
import { ThunkApiConfig } from "../project";
import { base64Encode } from "./uploadModel";

export type ResourceComponent = {
  key: string;
  resources: ResourceDeclaration;
};

export type UploadWordlistArgs = {
  path: string;
  wordList: ArrayBuffer;
  uploadedFilename: string;
};

export const uploadWordlist = createAsyncThunk<
  ResourceComponent,
  UploadWordlistArgs,
  ThunkApiConfig
>(
  "builder/uploadWordlist",
  async ({ path, wordList, uploadedFilename }, thunkApi) => {
    const {
      builder: { project },
    } = thunkApi.getState();

    if (project.state !== "loaded") {
      return thunkApi.rejectWithValue({
        state: "failed",
        message: "No project",
      });
    }

    const resources: ResourceDeclaration = {
      type: "string",
      path: `./${path}`,
    };
    const { id } = project.info;

    const raw = await fetch(
      `https://func.hotg.ai/function/sbfs/project/${project.info.name}/uploadedFilename`,
      {
        method: "POST",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/text",
        },
        body: base64Encode(wordList),
        mode: "no-cors",
      }
    );

    return {
      key: uploadedFilename,
      resources,
    };
  }
);
