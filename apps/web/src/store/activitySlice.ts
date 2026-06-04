import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { IActivity } from "@linkai/types";

interface ActivityState {
  items: IActivity[];
  total: number;
  page: number;
  loading: boolean;
}

const initialState: ActivityState = {
  items: [],
  total: 0,
  page: 1,
  loading: false,
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    setActivities: (
      state,
      action: PayloadAction<{ items: IActivity[]; total: number; page: number }>
    ) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.page = action.payload.page;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setActivities, setLoading: setActivityLoading } = activitySlice.actions;
export default activitySlice.reducer;
