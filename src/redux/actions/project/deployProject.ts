import { createAsyncThunk } from "@reduxjs/toolkit";
import { storm2rune } from "../../../canvas2rune";
import { ErrorMessage } from "../../../redux/builderSlice";
import { ProjectInfo } from "../../../redux/reducers/builder";
import { AppStoreState } from "../../../redux/store";
import { diagramToRuneCanvas } from "../../../utils/FlowUtils";
import { SerializedFlowDiagram } from "../../../canvas2rune/serialized";
import { FlowElements } from "../../../redux/reactFlowSlice";

export type RuneCompilerResponse = {
  "deployment-id"?: string;
  success: boolean;
  url?: string;
  causes?: string[];
  error?: string;
};

export const deployProject = createAsyncThunk<
  any,
  {
    diagram: FlowElements;
    // project: ProjectInfo;
    // Auth0Token: string;
    // cors: string;
    // bundleId?: string;
    // appNickname?: string;
    // appStoreId?: string;
  },
  {
    rejectValue: ErrorMessage;
  }
>("builder/deployProject", async (args, thunkApi) => {
  const errorMsg: ErrorMessage = {
    errorMessage: "Can't fetch apiKey and deploymentId",
  };
  const { diagram } = args;
  let ids: string | undefined = undefined;
  let url: string | undefined = undefined;
  const prevState = thunkApi.getState() as AppStoreState;
  const { project, resources, components } = prevState.builder;
  let response = undefined;
  try {
    let body: RuneCompilerResponse;
    if (project.state === "loaded") {
      console.log(
        await storm2rune(
          JSON.parse(
            JSON.stringify(
              diagramToRuneCanvas(project, resources, components, diagram)
            )
          ) as SerializedFlowDiagram
        )
      );
      response = await fetch(
        `https://func.hotg.ai/function/rune-compiler?project-id=${project.info.name}`,
        {
          method: "POST",
          cache: "no-cache",
          // headers: {
          //   "Content-Type": "application/yaml",
          // },
          body: await storm2rune(
            JSON.parse(
              JSON.stringify(
                diagramToRuneCanvas(project, resources, components, diagram)
              )
            ) as SerializedFlowDiagram
          ),
        }
      );
      if (response) {
        body = await response.json();
        const id = body["deployment-id"];
        if (body.success) {
          if (id && body.url) {
            ids = id;
            url = body.url;
          }
          const raw = await fetch(
            `https://func.hotg.ai/function/sbfs/project/${project.info.name}/deployment.json`,
            {
              method: "POST",
              cache: "no-cache",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
              mode: "no-cors",
            }
          );
        } else {
          return thunkApi.rejectWithValue({ errorMessage: body.error || "" });
        }
      } else {
        return thunkApi.rejectWithValue({
          errorMessage: "Error Creating Deployment",
        });
      }
    }
  } catch (error) {
    return thunkApi.rejectWithValue(errorMsg);
  }
  if (ids === undefined || url === undefined) {
    return thunkApi.rejectWithValue(errorMsg);
  } else return { id: ids, url };
});
