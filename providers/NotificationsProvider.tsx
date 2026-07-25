import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { api } from "@/lib/api";
import {
  clearBadge,
  onForegroundNotification,
  setBadgeCount,
} from "@/lib/pushNotifications";
import { useApp } from "@/providers/AppProvider";

const RATIONALE_KEY = "@carivo/notification-rationale-shown";
const POLL_INTERVAL_MS = 30_000;

interface NotificationsContextValue {
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clearLocal: () => void;
  markLocalRead: () => void;
  permissionRequested: boolean;
  markRationaleShown: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(RATIONALE_KEY).then((value) => {
      setPermissionRequested(value === "1");
    });
  }, []);

  const syncBadge = useCallback((count: number) => {
    const safeCount = Math.max(0, count);
    setBadgeCount(safeCount);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setUnreadCount(0);
      syncBadge(0);
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsLoading(true);
    try {
      const response = await api.getUnreadNotificationCount(accessToken);
      const count = response.data?.unread_count ?? 0;
      setUnreadCount(count);
      syncBadge(count);
    } catch {
      // keep prior state silently — refetched on next focus or poll
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, syncBadge]);

  const clearLocal = useCallback(() => {
    setUnreadCount(0);
    syncBadge(0);
  }, [syncBadge]);

  const markLocalRead = useCallback(() => {
    setUnreadCount((current) => {
      const next = Math.max(0, current - 1);
      syncBadge(next);
      return next;
    });
  }, [syncBadge]);

  const markRationaleShown = useCallback(async () => {
    await AsyncStorage.setItem(RATIONALE_KEY, "1");
    setPermissionRequested(true);
  }, []);

  // Initial + auth-change refresh
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Refresh when a notification arrives in foreground (BE is source of truth)
  useEffect(() => {
    const unsubscribe = onForegroundNotification(() => {
      void refresh();
    });
    return unsubscribe;
  }, [refresh]);

  // Poll when app foregrounds
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const handleChange = (state: AppStateStatus) => {
      if (state === "active") {
        void refresh();
        if (!timer) {
          timer = setInterval(() => {
            void refresh();
          }, POLL_INTERVAL_MS);
        }
      } else if (state === "background") {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleChange);
    if (AppState.currentState === "active") {
      timer = setInterval(() => {
        void refresh();
      }, POLL_INTERVAL_MS);
    }

    return () => {
      subscription.remove();
      if (timer) clearInterval(timer);
    };
  }, [refresh]);

  // On logout, drop the badge
  useEffect(() => {
    if (!isAuthenticated) {
      clearBadge();
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      unreadCount,
      isLoading,
      refresh,
      clearLocal,
      markLocalRead,
      permissionRequested,
      markRationaleShown,
    }),
    [
      unreadCount,
      isLoading,
      refresh,
      clearLocal,
      markLocalRead,
      permissionRequested,
      markRationaleShown,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}