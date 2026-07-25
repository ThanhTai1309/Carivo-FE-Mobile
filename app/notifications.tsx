import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Check, Trash2 } from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";
import { isUnreadNotification } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

export default function NotificationsScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter(isUnreadNotification).length,
    [notifications]
  );

  const resolveTarget = (
    item: NotificationItem
  ): { pathname: string; params?: Record<string, string> } | null => {
    const type = (item.related_type ?? item.type ?? "").toUpperCase();
    const id = item.related_id;
    if (!id) return null;

    if (type.includes("WAITLIST")) {
      return { pathname: "/waitlist/[id]", params: { id } };
    }
    if (type.includes("CASE") || type.includes("ISSUE")) {
      return { pathname: "/support/cases/[id]", params: { id } };
    }
    if (type.includes("BOOKING")) {
      return { pathname: "/booking-detail", params: { id } };
    }
    if (type.includes("VEHICLE")) {
      return { pathname: "/my-vehicles" };
    }
    return null;
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    if (isUnreadNotification(item)) {
      try {
        await api.markNotificationRead(accessToken!, item.id);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể đánh dấu đã đọc.";
        Alert.alert("Lỗi", message);
      }
    }

    const target = resolveTarget(item);
    if (target) {
      router.push(target as never);
    } else {
      await loadData();
    }
  };

  const loadData = async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getNotifications(accessToken);
      setNotifications(response.data ?? []);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể tải thông báo.";
      Alert.alert("Lỗi tải thông báo", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Thông báo"
          description="Đăng nhập customer để xem thông báo booking, khuyến mãi và loyalty."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải thông báo"
          description="Đang đồng bộ dữ liệu notification."
        />
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/profile");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 pt-5 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={handleBack}>
            <ArrowLeft size={22} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-primary">Thông báo</Text>
            {unreadCount > 0 ? (
              <Text className="text-xs text-muted-foreground mt-0.5">
                {unreadCount} thông báo chưa đọc
              </Text>
            ) : null}
          </View>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={async () => {
              try {
                await api.markAllNotificationsRead(accessToken!);
                await loadData();
              } catch (error) {
                const message =
                  error instanceof ApiError
                    ? error.message
                    : "Không thể cập nhật thông báo.";
                Alert.alert("Lỗi", message);
              }
            }}
            className="flex-row items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5"
          >
            <Check size={14} color="#1a5fd4" strokeWidth={2.6} />
            <Text className="text-xs font-semibold text-primary">
              Đọc tất cả
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
          />
        }
      >
        <View className="px-4 gap-3">
          {notifications.length === 0 ? (
            <View className="rounded-2xl bg-card p-5 items-center">
              <Bell size={22} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-base font-semibold text-foreground mt-3">
                Chưa có thông báo
              </Text>
            </View>
          ) : (
            notifications.map((item) => {
              const unread = isUnreadNotification(item);
              const target = resolveTarget(item);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    void handleOpenNotification(item);
                  }}
                  className={`rounded-2xl p-4 flex-row items-start gap-3 ${
                    unread ? "bg-secondary border border-primary/30" : "bg-card"
                  }`}
                >
                  <View className="relative pt-1">
                    <Bell
                      size={20}
                      color={unread ? "#1a5fd4" : "#94a3b8"}
                      strokeWidth={2.2}
                    />
                    {unread ? (
                      <View className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-1 leading-5">
                      {item.message}
                    </Text>
                    <View className="flex-row items-center justify-between mt-3">
                      <Text className="text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </Text>
                      {target ? (
                        <Text className="text-xs font-semibold text-primary">
                          Xem chi tiết →
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await api.deleteNotification(accessToken!, item.id);
                        await loadData();
                      } catch (error) {
                        const message =
                          error instanceof ApiError
                            ? error.message
                            : "Không thể xóa thông báo.";
                        Alert.alert("Lỗi", message);
                      }
                    }}
                    className="p-1"
                  >
                    <Trash2 size={18} color="#ef4444" strokeWidth={2.2} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
