import { createAsyncThunk } from "@reduxjs/toolkit";
import { ErrorMessage } from "../../builderSlice";
import { AppStoreState } from "../../store";

export type EditProjectNameParams = {
  oldName: string,
  newName: string
}

export const editProjectName = createAsyncThunk<
  string,
  EditProjectNameParams,
  {
    rejectValue: ErrorMessage;
  }
>("builder/editProjectName", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = { errorMessage: "Error Saving Project " };
  const { oldName, newName } = args;
  const prevState = thunkApi.getState() as AppStoreState;
  let projectInfo = undefined;
  const { forgeBuilder, credentials } = prevState.builder;

  if (forgeBuilder && credentials) {
    const projectIdentifier = `${credentials.username}/${oldName}`;

    try {
      projectInfo = await forgeBuilder.gitlab.Projects.edit(projectIdentifier, { name: newName });
    } catch (error) {
      // eslint-disable-next-line
      console.log("Error Editing Project Name:", error);
    }
  }

  if (projectInfo === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  }
  return projectInfo.name;
});