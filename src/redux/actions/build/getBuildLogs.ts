import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "console-feed/lib/definitions/Component";
import { ErrorMessage } from "../../../redux/builderSlice";
import { AppStoreState } from "../../../redux/store";
import { JobSchema } from "@gitbeaker/core/dist/types/types";
import { BuildLogParams } from ".";

const RANDOM_BASE = 100000000;

export type BuildLogsResponse = {
  jobId: string;
  message?: Message;
  status?: string;
  logs?: string;
};

export const getBuildLogs = createAsyncThunk<
  BuildLogsResponse,
  BuildLogParams,
  {
    rejectValue: ErrorMessage;
  }
>("builder/getBuildLogs", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = {
    errorMessage: "Error Getting Build Logs and Status ",
  };
  const prevState = thunkApi.getState() as AppStoreState;
  let response = undefined;
  let jobDetails: JobSchema | undefined = undefined;
  const { finishedJobId, project } = prevState.builder;
  let msg = "Build Failed";
  const message: Message = {
    id: `${new Date().getTime().toString()}-${Math.random() * RANDOM_BASE}`,
    method: "rawHTML",
    data: [response],
  };

  const result: BuildLogsResponse = {
    jobId: "666",
    message,
    status: "success",
  };
  return result;
});
