import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "@/providers/AppProvider";

export default function RootLayout() {
  return (
    <AppProvider>
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
        <Stack.Screen name="notifications" />
        <Stack.Screen name="booking/handover/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="booking/incident/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="waitlist" />
        <Stack.Screen name="waitlist/new" />
        <Stack.Screen name="waitlist/[id]" />
        <Stack.Screen name="support/cases/[id]" />
      </Stack>
    </AppProvider>
  );
}
