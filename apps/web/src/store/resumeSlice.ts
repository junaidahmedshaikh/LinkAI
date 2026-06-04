import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { IResume } from "@linkai/types";

interface ResumeState {
  items: IResume[];
  loading: boolean;
}

const initialState: ResumeState = { items: [], loading: false };

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    setResumes: (state, action: PayloadAction<IResume[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setResumes, setLoading: setResumeLoading } = resumeSlice.actions;
export default resumeSlice.reducer;
