import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { MessageType, sendMessage } from "@/services/messaging.service";

import {
  setAuthLoading,
  setUser,
  setAuthError,
  logout as logoutAction,
} from "@/store/authSlice";

import { setSyncUser } from "@/store/userSlice";

import type { RootState } from "@/store";

import type {
  AuthStateResponse,
  AuthUserResponse,
  LoginPayload,
  RegisterPayload,
} from "@/types/messages";

import type { ISyncUserResponse, IExtensionMeResponse } from "@linkai/types";

export function useExtensionAuth() {
  const dispatch = useDispatch();

  const auth = useSelector(
    (state: RootState) => state.auth
  );

  const hydrate = useCallback(async () => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const res = await sendMessage<AuthStateResponse>({
        type: MessageType.AUTH_GET_STATE,
      });

      if (!res.success || !res.data?.isAuthenticated) {
        dispatch(setUser(null));
        dispatch(setSyncUser(null));
        return;
      }

      const syncRes =
        await sendMessage<ISyncUserResponse>({
          type: MessageType.SYNC_FETCH_USER,
        });

      if (syncRes.success && syncRes.data) {
        dispatch(setUser(syncRes.data.user));
        dispatch(setSyncUser(syncRes.data));
        return;
      }

      const meRes =
        await sendMessage<IExtensionMeResponse>({
          type: MessageType.API_GET_ME,
        });

      if (meRes.success && meRes.data?.user) {
        dispatch(setUser(meRes.data.user));
        return;
      }

      dispatch(logoutAction());

      dispatch(
        setAuthError(
          "Session expired. Sign in again or open the web app while logged in to sync."
        )
      );
    } catch {
      dispatch(
        setAuthError("Failed to restore session")
      );
    } finally {
      dispatch(setAuthLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = async (
    email: string,
    password: string
  ) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const res = await sendMessage<AuthUserResponse>({
        type: MessageType.AUTH_LOGIN,
        payload: {
          email,
          password,
        } as LoginPayload,
      });

      if (!res.success || !res.data?.user) {
        dispatch(setUser(null));
        dispatch(setSyncUser(null));

        dispatch(
          setAuthError(
            res.error ??
              "Invalid email or password"
          )
        );

        return false;
      }

      dispatch(setUser(res.data.user));

      const syncRes =
        await sendMessage<ISyncUserResponse>({
          type: MessageType.SYNC_FETCH_USER,
        });

      if (syncRes.success && syncRes.data) {
        dispatch(setSyncUser(syncRes.data));
      }

      return true;
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const res = await sendMessage<AuthUserResponse>({
        type: MessageType.AUTH_REGISTER,
        payload: {
          fullName,
          email,
          password,
        } as RegisterPayload,
      });

      if (!res.success || !res.data?.user) {
        dispatch(setUser(null));
        dispatch(setSyncUser(null));

        dispatch(
          setAuthError(
            res.error ??
              "Registration failed"
          )
        );

        return false;
      }

      dispatch(setUser(res.data.user));

      const syncRes =
        await sendMessage<ISyncUserResponse>({
          type: MessageType.SYNC_FETCH_USER,
        });

      if (syncRes.success && syncRes.data) {
        dispatch(setSyncUser(syncRes.data));
      }

      return true;
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  const logout = async () => {
    await sendMessage({
      type: MessageType.AUTH_LOGOUT,
    });

    dispatch(logoutAction());
    dispatch(setSyncUser(null));
  };

  return {
    ...auth,
    hydrate,
    login,
    register,
    logout,
  };
}