import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Toast {
  id: string;
  message: string;
  variant: "info" | "success" | "error";
}

interface UiState {
  toasts: Toast[];
  offline: boolean;
  sidePanelOpen: boolean;
}

const initialState: UiState = {
  toasts: [],
  offline: !navigator.onLine,
  sidePanelOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, "id">>) => {
      state.toasts.push({ ...action.payload, id: `${Date.now()}` });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setOffline: (state, action: PayloadAction<boolean>) => {
      state.offline = action.payload;
    },
    setSidePanelOpen: (state, action: PayloadAction<boolean>) => {
      state.sidePanelOpen = action.payload;
    },
  },
});

export const { addToast, removeToast, setOffline, setSidePanelOpen } = uiSlice.actions;
export default uiSlice.reducer;
