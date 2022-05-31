import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "console-feed/src/definitions/Component";
import { ErrorMessage } from "../../../redux/builderSlice";
import { AppStoreState } from "../../../redux/store";

const RANDOM_BASE = 100000000;

export const loadBuildLogs = createAsyncThunk<
  {
    jobId: number;
    logs: Message[];
  },
  { projectId: number; jobId: number },
  {
    rejectValue: ErrorMessage;
  }
>("builder/loadBuildLogs", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = { errorMessage: "Error Fetching Build Logs " };
  const prevState = thunkApi.getState() as AppStoreState;
  const messages: Message[] = [];
  let response = undefined;
  // const { forgeBuilder } =
  //     prevState.builder;
  const { projectId, jobId } = args;
  // if (forgeBuilder) {
  //     try {
  //         const projectInfo = await forgeBuilder.getProjectInfo(projectId)
  //         response = await forgeBuilder.getBuildLogs(projectInfo, jobId);
  //         messages.push({
  //             id: `${new Date().getTime().toString()}-${Math.floor(Math.random() * RANDOM_BASE)}`,
  //             method: "info",
  //             data: [response]
  //         })
  //     } catch (error) { }
  // }
  if (response == undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  } else {
    return { jobId, logs: messages };
  }
});
