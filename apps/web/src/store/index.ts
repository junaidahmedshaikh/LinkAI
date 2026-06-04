import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import profileReducer from "./profileSlice";
import resumeReducer from "./resumeSlice";
import settingsReducer from "./settingsSlice";
import activityReducer from "./activitySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    resume: resumeReducer,
    settings: settingsReducer,
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
