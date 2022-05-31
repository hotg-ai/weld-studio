import { createAsyncThunk } from "@reduxjs/toolkit";
import { ErrorMessage } from "../../../redux/builderSlice";
import { AppStoreState } from "../../../redux/store";

export const deleteProject = createAsyncThunk<
  any,
  { projectId: number },
  {
    rejectValue: ErrorMessage;
  }
>("builder/deleteProject", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = { errorMessage: "Error Polling Job Status " };
  const prevState = thunkApi.getState() as AppStoreState;
  let projects = undefined;
  if (projects === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  } else {
    return [];
  }
});
