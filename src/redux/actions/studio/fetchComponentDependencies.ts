import { createAsyncThunk } from "@reduxjs/toolkit";
import { ThunkApiConfig } from "../project";
import { uploadModel } from "./uploadModel";

type FetchComponentDependencies = {
  componentID: string;
  token: string;
};

export const fetchComponentDependencies = createAsyncThunk<
  void,
  FetchComponentDependencies,
  ThunkApiConfig
>("builder/fetchComponentDependencies", async ({ componentID, token }, api) => {
  const {
    builder: { components, project },
  } = api.getState();

  if (!(componentID in components)) {
    // if we don't already know about this component, there's nothing to worry
    // about
    return;
  }

  const component = components[componentID];

  if (project.state !== "loaded" || component.type !== "model") {
    return;
  }

  const { identifier, displayName, source, downloadURL } = component;
  if (source !== "builtin" || !downloadURL) {
    return;
  }

  const response = await fetch(downloadURL);
  const model = await response.arrayBuffer();
  api.dispatch(uploadModel({ displayName, model, path: identifier, token }));
});
