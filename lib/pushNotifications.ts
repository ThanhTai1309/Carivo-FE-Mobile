import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { EventSubscription } from "expo-notifications";

const PUSH_TOKEN_STORAGE_KEY = "@carivo/push-token";
const ANDROID_CHANNEL_ID = "carwash-default";

export interface PushNotificationData {
  related_type?: string;
  related_id?: string;
  notification_id?: string;
  url?: string;
  [key: string]: unknown;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let foregroundSubscription: EventSubscription | null = null;
let responseSubscription: EventSubscription | null = null;
const listeners = new Set<(data: PushNotificationData) => void>();
const foregroundListeners = new Set<(data: PushNotificationData) => void>();

function notifyListeners(data: PushNotificationData) {
  listeners.forEach((listener) => {
    try {
      listener(data);
    } catch {
      // ignore listener errors to avoid breaking other listeners
    }
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Carivo thông báo",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#1a5fd4",
  });
}

export async function getOrCreateExpoPushToken(): Promise<string | null> {
  const existing = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (existing) return existing;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  await ensureAndroidChannel();

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
}

export async function clearPushToken() {
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}

export function setBadgeCount(count: number) {
  try {
    void Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // ignore on platforms that don't support badges
  }
}

export function clearBadge() {
  setBadgeCount(0);
}

export function onNotificationData(
  listener: (data: PushNotificationData) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function onForegroundNotification(
  listener: (data: PushNotificationData) => void
): () => void {
  const wrapped = (data: PushNotificationData) => listener(data);
  foregroundListeners.add(wrapped);
  return () => {
    foregroundListeners.delete(wrapped);
  };
}

function extractData(notification: Notifications.Notification): PushNotificationData {
  const raw = (notification.request.content.data ?? {}) as Record<string, unknown>;
  return {
    related_type: typeof raw.related_type === "string" ? raw.related_type : undefined,
    related_id: typeof raw.related_id === "string" ? raw.related_id : undefined,
    notification_id:
      typeof raw.notification_id === "string" ? raw.notification_id : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    ...raw,
  };
}

export function startNotificationObservers() {
  if (Platform.OS === "web") return;
  if (foregroundSubscription || responseSubscription) return;

  foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      const data = extractData(notification);
      foregroundListeners.forEach((listener) => {
        try {
          listener(data);
        } catch {
          // ignore listener errors
        }
      });
      notifyListeners(data);
    }
  );

  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      notifyListeners(extractData(response.notification));
    }
  );

  // Handle notification that launched the app
  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse?.notification) {
    // Defer to ensure listeners are registered before dispatch
    setTimeout(() => {
      notifyListeners(extractData(lastResponse.notification));
    }, 0);
  }
}

export function stopNotificationObservers() {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  responseSubscription?.remove();
  responseSubscription = null;
}

export async function refreshAndroidBadge() {
  if (Platform.OS !== "android") return;
  try {
    const count = await Notifications.getBadgeCountAsync();
    if (count > 0) await Notifications.setBadgeCountAsync(0);
  } catch {
    // ignore
  }
}
