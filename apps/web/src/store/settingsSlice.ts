import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { IUserSettings } from "@linkai/types";

interface SettingsState {
  data: IUserSettings | null;
  loading: boolean;
}

const initialState: SettingsState = { data: null, loading: false };

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<IUserSettings | null>) => {
      state.data = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setSettings, setLoading: setSettingsLoading } = settingsSlice.actions;
export default settingsSlice.reducer;
