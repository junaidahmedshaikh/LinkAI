import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { IProfile } from "@linkai/types";

interface ProfileState {
  data: IProfile | null;
  loading: boolean;
}

const initialState: ProfileState = { data: null, loading: false };

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<IProfile | null>) => {
      state.data = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setProfile, setLoading: setProfileLoading } = profileSlice.actions;
export default profileSlice.reducer;
