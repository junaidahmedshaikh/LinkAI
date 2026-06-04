import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageType, sendMessage } from "@/services/messaging.service";
import { setAuthLoading, setUser, setAuthError, logout as logoutAction } from "@/store/authSlice";
import { setSyncUser } from "@/store/userSlice";
import type { RootState } from "@/store";
import type { LoginPayload } from "@/types/messages";
import type { IUser, ISyncUserResponse, IExtensionMeResponse } from "@linkai/types";

export function useExtensionAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((s: RootState) => s.auth);

  const hydrate = useCallback(async () => {
    dispatch(setAuthLoading(true));
    const res = await sendMessage<{ isAuthenticated: boolean; userEmail?: string }>({
      type: MessageType.AUTH_GET_STATE,
    });
    if (res.success && res.data?.isAuthenticated) {
      const syncRes = await sendMessage<ISyncUserResponse>({ type: MessageType.SYNC_FETCH_USER });
      if (syncRes.success && syncRes.data) {
        dispatch(setUser(syncRes.data.user));
        dispatch(setSyncUser(syncRes.data));
      } else {
        const meRes = await sendMessage<IExtensionMeResponse>({ type: MessageType.API_GET_ME });
        if (meRes.success && meRes.data?.user) {
          dispatch(setUser(meRes.data.user));
        } else {
          dispatch(logoutAction());
        }
      }
    } else {
      dispatch(setUser(null));
      dispatch(setSyncUser(null));
    }
    dispatch(setAuthLoading(false));
  }, [dispatch]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = async (email: string, password: string) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));
    const res = await sendMessage<{ user: IUser }>({
      type: MessageType.AUTH_LOGIN,
      payload: { email, password } as LoginPayload,
    });
    if (res.success && res.data?.user) {
      dispatch(setUser(res.data.user));
      const syncRes = await sendMessage<ISyncUserResponse>({ type: MessageType.SYNC_FETCH_USER });
      if (syncRes.success && syncRes.data) dispatch(setSyncUser(syncRes.data));
    } else {
      dispatch(setAuthError(res.error ?? "Login failed"));
      dispatch(setUser(null));
    }
    dispatch(setAuthLoading(false));
    return res.success;
  };

  const logout = async () => {
    await sendMessage({ type: MessageType.AUTH_LOGOUT });
    dispatch(logoutAction());
    dispatch(setSyncUser(null));
  };

  return { ...auth, login, logout, hydrate };
}
