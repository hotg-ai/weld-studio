import { createAsyncThunk } from "@reduxjs/toolkit";
import { ErrorMessage } from "../../../redux/builderSlice";
import { AppStoreState } from "../../../redux/store";
import { JobSchema } from "@gitbeaker/core/dist/types/types";

export const cancelBuild = createAsyncThunk<
  any,
  { projectId: string | number },
  {
    rejectValue: ErrorMessage;
  }
>("builder/cancelBuild", async (args, thunkApi) => {
  console.log("CANCELLING BUILD");
  const errorMsg: ErrorMessage = {
    errorMessage: "Error Cancelling Build Job ",
  };
  const prevState = thunkApi.getState() as AppStoreState;
  let response = undefined;
  let selectedJob: JobSchema | undefined = undefined;
  const { currentBuildSHA } = prevState.builder;
  if (currentBuildSHA) {
    try {
      // let currentJobs = await forgeBuilder.gitlab.Jobs.all(args.projectId);
      // currentJobs = currentJobs.filter(
      //   (job) => job.status === "running" || job.status === "pending"
      // );
      // currentJobs.forEach((job) => {
      //   if (job.commit.id === currentBuildSHA) selectedJob = job;
      // });
      // if (selectedJob) {
      //   response = await forgeBuilder.gitlab.Jobs.cancel(
      //     args.projectId,
      //     selectedJob["id"]
      //   );
      // }
    } catch (error) {}
  }
  if (response === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  } else {
    return {};
  }
});
