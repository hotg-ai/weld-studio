import { configureStore, AnyAction } from "@reduxjs/toolkit";
import { builderSlice } from "./builderSlice";
import reactFlowDiagramReducer from "./reactFlowSlice";
import { ThunkAction } from "redux-thunk";

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppStoreState,
  unknown,
  AnyAction
>;
export const store = configureStore({
  reducer: {
    builder: builderSlice.reducer,
    flow: reactFlowDiagramReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "builder/UpdateComponents",
          "builder/SetForgeCredentials",
          "SELECT_NODE",
          "BUILD_PROJECT",
          "builder/createProject/rejected",
          "payload.components",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          "meta.arg",
          "payload.timestamp",
          "builder.forgeBuilder",
          "payload.components",
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "items.dates",
          "builder.forgeBuilder",
          "builder/createProject/fulfilled",
          "builder.components",
          "builder/openProject",
          "onboarding.components",
        ],
      },
    }),
});

export const getForgeLogs = (state: AppStoreState) => state.builder.forgeLogs;
export type AppStoreState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
