import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Bell,
  CarFront,
  CalendarClock,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  History,
  Hourglass,
  Info,
  KeyRound,
  LogOut,
  MessageSquareText,
  Pencil,
  Phone,
  Settings as SettingsIcon,
  ShieldAlert,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { compactName, formatDateTime, formatCurrency } from "@/lib/format";
import type { Booking, NotificationItem, WashHistory } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

interface MenuItem {
  icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    accessToken,
    authUser,
    isAuthenticated,
    isHydrated,
    logout,
    profile,
    refreshProfile,
    updateProfile,
    uploadImage,
  } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [histories, setHistories] = useState<WashHistory[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openCases, setOpenCases] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      return;
    }

    try {
      await refreshProfile();
      const [bookingsResponse, historiesResponse, notificationsResponse] =
        await Promise.all([
          api.getBookings(accessToken, { limit: 5 }),
          api.getWashHistories(accessToken, { limit: 5 }),
          api.getNotifications(accessToken),
        ]);
      setBookings(bookingsResponse.data ?? []);
      setHistories(historiesResponse.data ?? []);
      setNotifications(notificationsResponse.data ?? []);

      api
        .getMyCustomerCases(accessToken, {
          status: "SUBMITTED",
          limit: 100,
        })
        .then((res) => setOpenCases(res.data?.length ?? 0))
        .catch(() => undefined);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể tải hồ sơ.";
      Alert.alert("Lỗi tải hồ sơ", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, isAuthenticated, refreshProfile]);

  useEffect(() => {
    if (isHydrated) {
      void loadData();
    }
  }, [isHydrated, loadData]);

  const handlePickAvatar = async () => {
    if (avatarBusy) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Quyền truy cập ảnh",
          "Cần cấp quyền để thay đổi ảnh đại diện."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      setAvatarBusy(true);
      try {
        const uploaded = await uploadImage(asset.uri, asset.mimeType ?? "image/jpeg");
        await updateProfile({ avatar_url: uploaded.url });
        setAvatarVersion((v) => v + 1);
        Alert.alert("Thành công", "Đã cập nhật ảnh đại diện.");
      } finally {
        setAvatarBusy(false);
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể cập nhật ảnh.";
      Alert.alert("Lỗi cập nhật ảnh", message);
    }
  };

  if (!isHydrated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải hồ sơ"
          description="Đang khôi phục phiên đăng nhập."
        />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Hồ sơ customer"
          description="Đăng nhập để xem booking, xe đã lưu, lịch sử rửa xe và thông báo."
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
          title="Đang tải hồ sơ"
          description="Đang lấy dữ liệu customer."
        />
      </SafeAreaView>
    );
  }

  const displayName =
    profile?.full_name?.trim() ||
    authUser?.full_name?.trim() ||
    "Khách hàng";
  const displayEmail =
    profile?.email?.trim() || authUser?.email?.trim() || "";
  const displayPhone =
    profile?.phone?.trim() || authUser?.phone?.trim() || "";
  const avatarUrl = profile?.avatar_url || authUser?.avatar_url || null;
  const unreadCount = notifications.filter(
    (item) => item.in_app_status !== "READ"
  ).length;

  const sections: MenuSection[] = [
    {
      title: "Tài khoản",
      items: [
        {
          icon: Pencil,
          label: "Chỉnh sửa hồ sơ",
          onPress: () => router.push("/edit-profile"),
        },
        {
          icon: KeyRound,
          label: "Đổi mật khẩu",
          onPress: () => router.push("/settings"),
        },
        {
          icon: CarFront,
          label: "Phương tiện của tôi",
          value: `${bookings.length ? "Xem tất cả" : "Chưa có"}`,
          onPress: () => router.push("/my-vehicles"),
        },
        {
          icon: History,
          label: "Ví voucher",
          onPress: () => router.push("/vouchers"),
        },
      ],
    },
  {
    title: "Hoạt động",
    items: [
      {
        icon: CalendarClock,
        label: "Lịch sử đặt lịch",
        value: `${bookings.length}`,
        onPress: () => router.push("/(tabs)/booking-history"),
      },
      {
        icon: Bell,
        label: "Thông báo",
        value: unreadCount > 0 ? `${unreadCount} mới` : "Đã xem",
        onPress: () => router.push("/notifications"),
      },
      {
        icon: History,
        label: "Lịch sử rửa xe",
        value: `${histories.length}`,
        onPress: () => router.push("/history"),
      },
      {
        icon: MessageSquareText,
        label: "Đánh giá của tôi",
        onPress: () => router.push("/reviews"),
      },
      {
        icon: ShieldAlert,
        label: "Độ tin cậy đặt lịch",
        onPress: () => router.push("/booking-reliability"),
      },
      {
        icon: Hourglass,
        label: "Danh sách chờ slot",
        onPress: () => router.push("/waitlist"),
      },
    ],
  },
    {
      title: "Hỗ trợ",
      items: [
        {
          icon: CircleHelp,
          label: "Trợ giúp & Khiếu nại",
          value: openCases > 0 ? `${openCases} đang mở` : undefined,
          onPress: () => router.push("/support"),
        },
        {
          icon: Info,
          label: "Về Carivo",
          onPress: () => router.push("/about"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
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
        {/* Header */}
        <View className="px-5 pt-5 pb-6">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-2xl font-bold text-foreground">
              Tài khoản của tôi
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="w-10 h-10 rounded-full bg-card items-center justify-center"
            >
              <SettingsIcon size={18} color="#1a1a1a" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Avatar + info card */}
          <View
            className="rounded-3xl bg-card px-5 py-5 flex-row items-center gap-4"
            style={{
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            <TouchableOpacity
              onPress={handlePickAvatar}
              activeOpacity={0.85}
              disabled={avatarBusy}
              className="relative"
            >
              <View
                className="w-20 h-20 rounded-full bg-secondary items-center justify-center overflow-hidden"
                style={{
                  borderWidth: 3,
                  borderColor: "#ffffff",
                  shadowColor: "#1a5fd4",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.18,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                {avatarUrl ? (
                  <Image
                    key={`${avatarUrl}-${avatarVersion}`}
                    source={{ uri: avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <CircleUserRound
                    size={42}
                    color="#1a5fd4"
                    strokeWidth={1.8}
                  />
                )}
              </View>
              <View
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary items-center justify-center"
                style={{
                  borderWidth: 2,
                  borderColor: "#ffffff",
                }}
              >
                {avatarBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Pencil size={12} color="#ffffff" strokeWidth={2.6} />
                )}
              </View>
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                {compactName(displayName)}
              </Text>
              {displayEmail ? (
                <Text
                  className="text-xs text-muted-foreground mt-1"
                  numberOfLines={1}
                >
                  {displayEmail}
                </Text>
              ) : null}
              {displayPhone ? (
                <View className="flex-row items-center gap-1 mt-1">
                  <Phone size={11} color="#7a8599" strokeWidth={2.2} />
                  <Text className="text-xs text-muted-foreground">
                    {displayPhone}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                onPress={() => router.push("/edit-profile")}
                className="mt-2 self-start rounded-full bg-secondary px-3 py-1"
              >
                <Text className="text-[11px] font-semibold text-primary">
                  Cập nhật hồ sơ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View className="px-4">
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-card p-4 items-start">
              <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center mb-2">
                <History size={18} color="#1a5fd4" strokeWidth={2.2} />
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {bookings.length}
              </Text>
              <Text className="text-[11px] text-muted-foreground mt-0.5">
                Booking gần đây
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-card p-4 items-start">
              <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center mb-2">
                <CarFront size={18} color="#1a5fd4" strokeWidth={2.2} />
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {histories.length}
              </Text>
              <Text className="text-[11px] text-muted-foreground mt-0.5">
                Lần rửa xe
              </Text>
            </View>
          </View>
        </View>

        {/* Menu sections */}
        <View className="px-4 mt-5 gap-5">
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              {section.title ? (
                <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 ml-2">
                  {section.title}
                </Text>
              ) : null}
              <View
                className="rounded-2xl bg-card overflow-hidden"
                style={{
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={`${sectionIndex}-${itemIndex}`}
                      onPress={item.onPress}
                      activeOpacity={0.7}
                      className={`flex-row items-center gap-3 px-4 py-3.5 ${
                        itemIndex < section.items.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center ${
                          item.destructive ? "bg-red-50" : "bg-secondary"
                        }`}
                      >
                        <Icon
                          size={18}
                          color={item.destructive ? "#ef4444" : "#1a5fd4"}
                          strokeWidth={2.2}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-sm font-medium ${
                            item.destructive
                              ? "text-red-500"
                              : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </Text>
                        {item.value ? (
                          <Text className="text-[11px] text-muted-foreground mt-0.5">
                            {item.value}
                          </Text>
                        ) : null}
                      </View>
                      <ChevronRight
                        size={18}
                        color={item.destructive ? "#ef4444" : "#94a3b8"}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Logout */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Đăng xuất",
                  style: "destructive",
                  onPress: async () => {
                    await logout();
                    if (router.canDismiss()) {
                      router.dismissAll();
                    }
                    router.replace("/login");
                  },
                },
              ]);
            }}
            activeOpacity={0.85}
            className="rounded-2xl bg-card p-4 flex-row items-center gap-3"
          >
            <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
              <LogOut size={18} color="#ef4444" strokeWidth={2.2} />
            </View>
            <Text className="flex-1 text-sm font-semibold text-red-500">
              Đăng xuất
            </Text>
            <ChevronRight size={18} color="#ef4444" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Recent bookings preview */}
          {bookings.length > 0 ? (
            <View>
              <View className="flex-row items-center justify-between mb-2 ml-2">
                <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Lịch hẹn gần đây
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/booking")}>
                  <Text className="text-[11px] font-semibold text-primary">
                    Đặt thêm
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                className="rounded-2xl bg-card overflow-hidden"
                style={{
                  shadowColor: "#0f172a",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {bookings.slice(0, 3).map((booking, index) => (
                  <View
                    key={booking.id}
                    className={`flex-row items-center gap-3 px-4 py-3 ${
                      index < Math.min(bookings.length, 3) - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                      <CarFront size={18} color="#1a5fd4" strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {booking.service_package?.name ??
                          booking.service_package_id}
                      </Text>
                      <Text
                        className="text-[11px] text-muted-foreground mt-0.5"
                        numberOfLines={1}
                      >
                        {booking.garage?.name ?? booking.garage_id} •{" "}
                        {formatDateTime(booking.start_time)}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor:
                          booking.status === "COMPLETED"
                            ? "#dcfce7"
                            : booking.status === "CANCELED"
                            ? "#fee2e2"
                            : "#dbe7fb",
                      }}
                      className="px-2.5 py-1 rounded-full"
                    >
                      <Text
                        style={{
                          color:
                            booking.status === "COMPLETED"
                              ? "#15803d"
                              : booking.status === "CANCELED"
                              ? "#b91c1c"
                              : "#1a5fd4",
                        }}
                        className="text-[10px] font-bold"
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Recent wash history */}
          <View>
            <View className="flex-row items-center justify-between mb-2 ml-2">
              <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Lịch sử rửa xe
              </Text>
              <TouchableOpacity onPress={() => router.push("/history")}>
                <Text className="text-[11px] font-semibold text-primary">
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="rounded-2xl bg-card overflow-hidden"
              style={{
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {histories.length === 0 ? (
                <View className="px-4 py-4 flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                    <History size={18} color="#1a5fd4" strokeWidth={2.2} />
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/history")}
                    className="flex-1"
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      Chưa có lần rửa nào
                    </Text>
                    <Text className="text-[11px] text-muted-foreground mt-0.5">
                      Sau dịch vụ đầu tiên, lịch sử sẽ hiển thị ở đây.
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                histories.slice(0, 3).map((history, index) => (
                  <TouchableOpacity
                    key={history.id}
                    onPress={() =>
                      router.push({
                        pathname: "/history/[id]",
                        params: { id: history.id },
                      })
                    }
                    className={`flex-row items-center gap-3 px-4 py-3 active:opacity-80 ${
                      index < Math.min(histories.length, 3) - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                      <History size={18} color="#1a5fd4" strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {history.service_package?.name ?? "Dịch vụ đã hoàn tất"}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5">
                        {history.garage?.name ?? "Garage"} •{" "}
                        {formatCurrency(history.amount_paid)}
                      </Text>
                    </View>
                    <ChevronRight
                      size={16}
                      color="#94a3b8"
                      strokeWidth={2.2}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
