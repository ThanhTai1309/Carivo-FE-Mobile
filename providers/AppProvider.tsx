import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import {
  clearPushToken,
  getOrCreateExpoPushToken,
} from "@/lib/pushNotifications";
import type {
  PhoneVerificationChallenge,
  PhoneVerificationToken,
  UserPublic,
} from "@/lib/types";

interface RegisterPayload {
  email?: string;
  full_name?: string;
  password: string;
  phone: string;
  phone_verification_token: string;
}

export type UploadPurpose =
  | "USER_AVATAR"
  | "VEHICLE_PHOTO"
  | "BOOKING_PROBLEM"
  | "CUSTOMER_CASE_EVIDENCE"
  | "HANDOVER_DOCUMENT"
  | "REVIEW";

export interface UploadedFile {
  id: string;
  url: string;
  purpose?: UploadPurpose;
}

interface AppContextValue {
  accessToken: string | null;
  authUser: UserPublic | null;
  profile: UserPublic | null;
  authBusy: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  requestPhoneVerification: (
    phone: string,
    purpose?: "REGISTER" | "CHANGE_PHONE"
  ) => Promise<PhoneVerificationChallenge>;
  verifyPhoneOtp: (
    challengeId: string,
    otp: string
  ) => Promise<PhoneVerificationToken>;
  registerCustomer: (payload: RegisterPayload) => Promise<void>;
  forgotPassword: (phone: string) => Promise<void>;
  resetPassword: (
    phone: string,
    resetToken: string,
    newPassword: string
  ) => Promise<void>;
  updateProfile: (payload: {
    full_name?: string;
    email?: string | null;
    avatar_url?: string | null;
    phone?: string;
    current_password?: string;
    phone_verification_token?: string;
  }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  uploadImage: (
    uri: string,
    mimeType?: string,
    purpose?: UploadPurpose
  ) => Promise<UploadedFile>;
}

const TOKEN_STORAGE_KEY = "@carivo/access-token";
const USER_STORAGE_KEY = "@carivo/auth-user";

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<UserPublic | null>(null);
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
          TOKEN_STORAGE_KEY,
          USER_STORAGE_KEY,
        ]);

        if (cancelled) return;

        if (storedToken) {
          setAccessToken(storedToken);
          if (storedUser) {
            try {
              setAuthUser(JSON.parse(storedUser) as UserPublic);
            } catch {
              // ignore corrupted JSON
            }
          }
          // Validate token by fetching fresh profile in the background
          try {
            const response = await api.getProfile(storedToken);
            if (!cancelled) {
              setProfile(response.data);
              if (response.data) setAuthUser(response.data);
            }
            // Re-register push notifications for this authenticated session
            void getOrCreateExpoPushToken();
          } catch {
            // Token invalid / expired — clear storage silently
            if (!cancelled) {
              await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
              setAccessToken(null);
              setAuthUser(null);
              setProfile(null);
            }
          }
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      setProfile(null);
      return;
    }

    const response = await api.getProfile(accessToken);
    setProfile(response.data);
    setAuthUser(response.data);
  }, [accessToken]);

  const login = async (phone: string, password: string) => {
    setAuthBusy(true);
    try {
      const response = await api.login(phone, password);
      const token = response.data.access_token;
      const user = response.data.user;
      setAccessToken(token);
      setAuthUser(user);
      await AsyncStorage.multiSet([
        [TOKEN_STORAGE_KEY, token],
        [USER_STORAGE_KEY, JSON.stringify(user)],
      ]);
      try {
        const profileResponse = await api.getProfile(token);
        setProfile(profileResponse.data);
        if (profileResponse.data) {
          setAuthUser(profileResponse.data);
          await AsyncStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(profileResponse.data)
          );
        }
      } catch {
        // profile fetch failure should not block login
      }
      // Register for push notifications after successful login
      void getOrCreateExpoPushToken();
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    setAuthBusy(true);
    try {
      if (accessToken) {
        try {
          await api.logout(accessToken);
        } catch {
          // Local logout should still proceed if the server cookie session is absent.
        }
      }
    } finally {
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      await clearPushToken();
      setAccessToken(null);
      setAuthUser(null);
      setProfile(null);
      setAuthBusy(false);
    }
  };

  const requestPhoneVerification = async (
    phone: string,
    purpose: "REGISTER" | "CHANGE_PHONE" = "REGISTER"
  ) => {
    const response = await api.requestPhoneVerification(phone, purpose);
    return response.data;
  };

  const verifyPhoneOtp = async (challengeId: string, otp: string) => {
    const response = await api.verifyPhoneOtp(challengeId, otp);
    return response.data;
  };

  const registerCustomer = async (payload: RegisterPayload) => {
    setAuthBusy(true);
    try {
      await api.register(payload);
      await login(payload.phone, payload.password);
    } finally {
      setAuthBusy(false);
    }
  };

  const forgotPassword = async (phone: string) => {
    await api.forgotPassword(phone);
  };

  const resetPassword = async (
    phone: string,
    resetToken: string,
    newPassword: string
  ) => {
    await api.resetPassword(phone, resetToken, newPassword);
  };

  const updateProfile = async (payload: {
    full_name?: string;
    email?: string | null;
    avatar_url?: string | null;
    phone?: string;
    current_password?: string;
    phone_verification_token?: string;
  }) => {
    if (!accessToken) {
      throw new Error("Dang nhap de tiep tuc");
    }

    const response = await api.updateProfile(accessToken, payload);
    setProfile(response.data);
    setAuthUser((current) => ({ ...(current ?? {}), ...response.data }));
    await AsyncStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({ ...(authUser ?? {}), ...response.data })
    );
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!accessToken) {
      throw new Error("Dang nhap de tiep tuc");
    }
    await api.changePassword(accessToken, currentPassword, newPassword);
  };

  const uploadImage = async (
    uri: string,
    mimeType?: string,
    purpose: UploadPurpose = "USER_AVATAR"
  ) => {
    if (!accessToken) {
      throw new Error("Dang nhap de tiep tuc");
    }

    const formData = new FormData();
    const fileName = uri.split("/").pop() ?? `avatar-${Date.now()}.jpg`;
    formData.append("file", {
      uri,
      name: fileName,
      type: mimeType ?? "image/jpeg",
    } as unknown as Blob);
    formData.append("purpose", purpose);

    const response = await api.uploadFile(accessToken, formData);
    return { ...response.data, purpose };
  };

  const value = useMemo<AppContextValue>(
    () => ({
      accessToken,
      authUser,
      profile,
      authBusy,
      isAuthenticated: Boolean(accessToken),
      isHydrated,
      login,
      logout,
      refreshProfile,
      requestPhoneVerification,
      verifyPhoneOtp,
      registerCustomer,
      forgotPassword,
      resetPassword,
      updateProfile,
      changePassword,
      uploadImage,
    }),
    [accessToken, authBusy, authUser, profile, isHydrated, refreshProfile]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }

  return context;
}
