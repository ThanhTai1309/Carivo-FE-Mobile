import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import NotificationRationaleModal from "@/components/common/NotificationRationaleModal";
import { useApp } from "@/providers/AppProvider";
import { useNotifications } from "@/providers/NotificationsProvider";

type PermissionPayload = Notifications.NotificationPermissionsStatus;

function isIosDenied(status: PermissionPayload) {
  return (
    Platform.OS === "ios" &&
    status.ios?.status === Notifications.IosAuthorizationStatus.DENIED
  );
}

function isGranted(status: PermissionPayload) {
  if (Platform.OS === "ios") {
    const s = status.ios?.status;
    return (
      s === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      s === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      s === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }
  return status.status === "granted";
}

export default function NotificationPermissionGate() {
  const { isAuthenticated } = useApp();
  const { permissionRequested, markRationaleShown } = useNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (permissionRequested) return;

    let cancelled = false;
    (async () => {
      const status = await Notifications.getPermissionsAsync();
      if (cancelled) return;
      if (isGranted(status) || isIosDenied(status)) {
        // Already decided — nothing to ask. Mark rationale seen so we never prompt again.
        await markRationaleShown();
        return;
      }
      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, permissionRequested, markRationaleShown]);

  const handleEnable = async () => {
    const result = await Notifications.requestPermissionsAsync();
    await markRationaleShown();
    setVisible(false);
    // Return value is ignored — provider will refresh on its own.
    void result;
  };

  const handleDismiss = async () => {
    await markRationaleShown();
    setVisible(false);
  };

  return (
    <NotificationRationaleModal
      visible={visible}
      onDismiss={handleDismiss}
      onEnable={handleEnable}
    />
  );
}