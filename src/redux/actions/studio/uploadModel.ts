import { createAsyncThunk } from "@reduxjs/toolkit";
// Removal of the following import creates scary error phantoms in the tests
import { AppDispatch, AppStoreState } from "../../../redux/store";
import { ElementType, Model, Tensor } from "../../../components/Analysis/model";
import { ThunkApiConfig } from "../project";

export function base64Encode(buffer: ArrayBuffer): string {
  const charCodes: string[] = [];
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    charCodes.push(String.fromCharCode(bytes[i]));
  }
  return window.btoa(charCodes.join(""));
}

type ModelComponent = {
  key: string;
  model: Model;
};

type ModelInfoTensor = {
  name: string;
  element_kind: ElementType;
  dims: number[];
};

export type ModelInfo = {
  inputs: ModelInfoTensor[];
  outputs: ModelInfoTensor[];
  ops: number;
};

type UploadModelArgs = {
  displayName: string;
  path: string;
  model: ArrayBuffer;
};

async function modelInfo(file: ArrayBuffer, token: string): Promise<ModelInfo> {
  const studioURI = process.env.REACT_APP_STUDIO_URI;

  const formdata = new FormData();
  formdata.append("file", new Blob([file]), "model");

  const response = await fetch(`${studioURI}/modelInfo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formdata,
    redirect: "follow",
  });
  return response.json();
}

function toForgeTensor({ name, element_kind, dims }: ModelInfoTensor): Tensor {
  return {
    displayName: name,
    elementType: element_kind,
    dimensions: dims,
  };
}

export const uploadModel = createAsyncThunk<
  ModelComponent,
  UploadModelArgs,
  ThunkApiConfig
>("builder/uploadModel", async ({ path, model, displayName }, thunkApi) => {
  const { inputs, outputs } = await modelInfo(model, "");
  const key = `model/${path}`;
  const component: Model = {
    type: "model",
    displayName,
    identifier: path,
    format: "tensorflow-lite",
    source: "custom",
    inputs: inputs.map(toForgeTensor),
    outputs: outputs.map(toForgeTensor),
  };
  const raw = await fetch(
    `https://func.hotg.ai/function/sbfs/project/${displayName}/${key}`,
    {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: base64Encode(model),
      mode: "no-cors",
    }
  );
  return { key, model: component };
});
