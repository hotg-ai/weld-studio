import { createAsyncThunk } from "@reduxjs/toolkit";
import { ErrorMessage } from "../../../redux/builderSlice";
import { AppStoreState } from "../../../redux/store";
import { BuildLogParams } from ".";

export const pollBuildStatus = createAsyncThunk<
  { jobId?: number; s3Url?: string },
  BuildLogParams,
  {
    rejectValue: ErrorMessage;
  }
>("builder/pollBuildStatus", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = { errorMessage: "Error Polling Job Status " };
  const prevState = thunkApi.getState() as AppStoreState;
  let jobId = undefined;
  let s3Url = undefined;
  const { latestBuild } = args;
  const { project, credentials } = prevState.builder;
  let { currentBuildSHA } = prevState.builder;
  if (
    !currentBuildSHA &&
    latestBuild &&
    latestBuild.running &&
    project.state === "loaded"
  )
    currentBuildSHA = latestBuild.commitId;
  if (project && currentBuildSHA && credentials) {
  }
  if (jobId === undefined && s3Url === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  } else {
    return { jobId, s3Url };
  }
});
