import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/providers/AppProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import NotificationPermissionGate from "@/providers/NotificationPermissionGate";
import {
  onNotificationData,
  startNotificationObservers,
  stopNotificationObservers,
} from "@/lib/pushNotifications";
import { handleNotificationDeepLink } from "@/lib/deepLinks";

export default function RootLayout() {
  useEffect(() => {
    startNotificationObservers();
    const unsubscribe = onNotificationData((data) => {
      handleNotificationDeepLink(data);
    });
    return () => {
      unsubscribe();
      stopNotificationObservers();
    };
  }, []);

  return (
    <AppProvider>
      <NotificationsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="payment-success" />
          <Stack.Screen name="my-vehicles" />
          <Stack.Screen name="vehicle-form" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="booking-detail" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="booking/handover/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking/incident/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="history" />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen name="reviews" />
          <Stack.Screen name="booking-reliability" />
          <Stack.Screen name="booking-violation-appeal" />
          <Stack.Screen name="review/[bookingId]" />
          <Stack.Screen name="waitlist" />
          <Stack.Screen name="waitlist/new" />
          <Stack.Screen name="waitlist/[id]" />
          <Stack.Screen name="support/cases/[id]" />
        </Stack>
        <NotificationPermissionGate />
      </NotificationsProvider>
    </AppProvider>
  );
}
