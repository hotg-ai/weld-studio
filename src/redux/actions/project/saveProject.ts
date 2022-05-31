import { createAsyncThunk } from "@reduxjs/toolkit";
import { storm2rune } from "src/canvas2rune";
import { SerializedFlowDiagram } from "src/canvas2rune/serialized";
import { ErrorMessage } from "../../../redux/builderSlice";
import { FlowElements } from "../../../redux/reactFlowSlice";
import { AppStoreState } from "../../../redux/store";
import { execute, getOutputs } from "src/screens/Studio/model/executor";
import { diagramToRuneCanvas } from "src/screens/Studio/utils/FlowUtils";

export type SaveProjectParams = {
  diagram: FlowElements;
};

export const saveProject = createAsyncThunk<
  string,
  SaveProjectParams,
  {
    rejectValue: ErrorMessage;
  }
>("builder/saveProject", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = { errorMessage: "Error Saving Project " };
  const { diagram } = args;
  const prevState = thunkApi.getState() as AppStoreState;
  let response = undefined;
  const { project, resources, components } = prevState.builder;

  if (project.state === "loaded") {
    const body = JSON.stringify(
      diagramToRuneCanvas(project, resources, components, diagram),
      null,
      4
    );
    try {
      const indent = 4;
      const raw = await fetch(
        `https://func.hotg.ai/function/sbfs/project/${project.info.name}/rune_canvas.json`,
        {
          method: "POST",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );
      const runefile = await fetch(
        `https://func.hotg.ai/function/sbfs/project/${project.info.name}/Runefile.yml`,
        {
          method: "POST",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/yaml",
          },
          body,
        }
      );
      let result = await execute(project.info.name, {});
      let r = await getOutputs(
        diagramToRuneCanvas(project, resources, components, diagram)
      );
    } catch (error) {
      // eslint-disable-next-line
      console.log("Error Building/Saving Project:", error);
    }
  }

  if (response === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  }
  return "";
});
