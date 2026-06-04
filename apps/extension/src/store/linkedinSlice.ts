import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { LinkedInPageType } from "@linkai/types";

interface LinkedInState {
  pageType: LinkedInPageType;
  url: string;
  isOnLinkedIn: boolean;
  lastExtracted?: Record<string, unknown>;
}

const initialState: LinkedInState = {
  pageType: "unknown",
  url: "",
  isOnLinkedIn: false,
};

const linkedinSlice = createSlice({
  name: "linkedin",
  initialState,
  reducers: {
    setLinkedInContext: (state, action: PayloadAction<Partial<LinkedInState>>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const { setLinkedInContext } = linkedinSlice.actions;
export default linkedinSlice.reducer;
