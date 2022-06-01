import { createAsyncThunk } from "@reduxjs/toolkit";
import { ErrorMessage } from "../../../redux/builderSlice";
import { AppStoreState } from "../../../redux/store";

export type listProjectsParams = {};

export const listProjects = createAsyncThunk<
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  any,
  listProjectsParams,
  {
    rejectValue: ErrorMessage;
  }
>("builder/listProjects", async (_args, thunkApi) => {
  const errorMsg: ErrorMessage = { errorMessage: "Error Listing Projects " };
  const prevState = thunkApi.getState() as AppStoreState;
  let response = undefined;
  const { credentials } = prevState.builder;
  if (credentials) {
  }
  if (response === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  } else return response;
});
