import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ISyncUserResponse } from "@linkai/types";

const userSlice = createSlice({
  name: "user",
  initialState: null as ISyncUserResponse | null,
  reducers: {
    setSyncUser: (_state, action: PayloadAction<ISyncUserResponse | null>) => action.payload,
  },
});

export const { setSyncUser } = userSlice.actions;
export default userSlice.reducer;
