import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CalendarClock,
  CarFront,
  ChevronRight,
  Coins,
  Filter,
  Inbox,
  MapPin,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import {
  formatCurrency,
  formatDateLabel,
  formatDateTime,
} from "@/lib/format";
import type { Booking, WashHistory } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

type FilterTab = "ALL" | "ONGOING" | "COMPLETED" | "CANCELED";

interface EnrichedBooking extends Booking {
  paymentMethod?: string;
  paidAt?: string;
  completedAt?: string;
  amountPaid?: number;
}

const TAB_LABELS: Record<FilterTab, string> = {
  ALL: "Tất cả",
  ONGOING: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELED: "Đã hủy",
};

function classifyTab(status: Booking["status"]): FilterTab {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "CANCELED" || status === "NO_SHOW") return "CANCELED";
  return "ONGOING";
}

function timeUntilStart(iso: string): string {
  const delta = new Date(iso).getTime() - Date.now();
  if (delta <= 0) return "Đã đến";
  const mins = Math.floor(delta / 60000);
  if (mins < 60) return `Còn ${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Còn ${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `Còn ${days} ngày`;
}

function StatusPill({ status }: { status: Booking["status"] }) {
  const palette: Record<string, { bg: string; fg: string; label: string }> = {
    PENDING: { bg: "#fef3c7", fg: "#a16207", label: "Chờ xác nhận" },
    CONFIRMED: { bg: "#dbe7fb", fg: "#1a5fd4", label: "Đã xác nhận" },
    CHECKED_IN: { bg: "#ede9fe", fg: "#6d28d9", label: "Check-in" },
    IN_PROGRESS: { bg: "#cffafe", fg: "#0e7490", label: "Đang rửa" },
    COMPLETED: { bg: "#dcfce7", fg: "#15803d", label: "Hoàn thành" },
    CANCELED: { bg: "#fee2e2", fg: "#b91c1c", label: "Đã hủy" },
    NO_SHOW: { bg: "#f1f5f9", fg: "#475569", label: "Không đến" },
  };
  const style = palette[status] ?? palette.PENDING;

  return (
    <View
      style={{ backgroundColor: style.bg }}
      className="self-start px-2.5 py-1 rounded-full"
    >
      <Text
        style={{ color: style.fg }}
        className="text-[10px] font-bold tracking-wide"
      >
        {style.label}
      </Text>
    </View>
  );
}

function BookingCard({
  booking,
  onPress,
}: {
  booking: EnrichedBooking;
  onPress: () => void;
}) {
  const serviceName =
    booking.service_package?.name ?? booking.service_package_id;
  const garageName = booking.garage?.name ?? booking.garage_id;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="rounded-2xl bg-card p-4 mb-3 flex-row gap-3"
      style={{
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="w-12 h-12 rounded-xl bg-secondary items-center justify-center flex-shrink-0">
        <CarFront size={22} color="#1a5fd4" strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text
              className="text-sm font-bold text-foreground"
              numberOfLines={1}
            >
              {serviceName}
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={11} color="#7a8599" strokeWidth={2.2} />
              <Text
                className="text-[11px] text-muted-foreground"
                numberOfLines={1}
              >
                {garageName}
              </Text>
            </View>
          </View>
          <StatusPill status={booking.status} />
        </View>

        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row items-center gap-1">
            <CalendarClock size={11} color="#7a8599" strokeWidth={2.2} />
            <Text className="text-[11px] text-muted-foreground">
              {formatDateTime(booking.start_time)}
            </Text>
          </View>
          <Text className="text-sm font-bold text-primary">
            {formatCurrency(booking.final_price ?? booking.original_price)}
          </Text>
        </View>

        {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
          <View className="self-start mt-2 flex-row items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-blue-700">
              {timeUntilStart(booking.start_time)}
            </Text>
          </View>
        ) : null}

        {typeof booking.earned_points === "number" && booking.earned_points > 0 ? (
          <View className="flex-row items-center gap-1 mt-2 self-start bg-amber-50 px-2 py-0.5 rounded-full">
            <Coins size={11} color="#a16207" strokeWidth={2.4} />
            <Text className="text-[10px] font-bold text-amber-700">
              +{booking.earned_points} điểm
            </Text>
          </View>
        ) : null}
      </View>
      <View className="items-center justify-center">
        <ChevronRight size={18} color="#94a3b8" strokeWidth={2.2} />
      </View>
    </TouchableOpacity>
  );
}

export default function BookingHistoryScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  const loadPage = useCallback(
    async (_pageToLoad: number, _refresh = false) => {
      if (!accessToken) return;

      setLoading(true);

      try {
        const [bookingResponse, washResponse] = await Promise.all([
          api.getBookings(accessToken, { page: 1, limit: 100 }),
          api.getWashHistories(accessToken, { limit: 100 }),
        ]);

        const washList = washResponse?.data ?? [];

        const list = (bookingResponse.data ?? []).map((b) => {
          const enriched: EnrichedBooking = { ...b };
          const match = washList.find((w) => w.booking_id === b.id);
          if (match) {
            enriched.completedAt = match.service_completed_at;
            enriched.paidAt = match.paid_at;
            enriched.paymentMethod = match.payment_method;
            enriched.amountPaid = match.amount_paid;
          }
          return enriched;
        });

        setBookings(list);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải lịch sử đặt lịch.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      if (isHydrated && isAuthenticated) {
        void loadPage(1, true);
      }
    }, [isHydrated, isAuthenticated, loadPage])
  );

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return bookings;
    return bookings.filter((b) => classifyTab(b.status) === activeTab);
  }, [bookings, activeTab]);

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === "COMPLETED");
    const canceled = bookings.filter((b) =>
      ["CANCELED", "NO_SHOW"].includes(b.status)
    );
    const ongoing = bookings.filter(
      (b) => !["COMPLETED", "CANCELED", "NO_SHOW"].includes(b.status)
    );
    const totalSpent = completed.reduce(
      (sum, b) => sum + (b.final_price ?? b.original_price ?? 0),
      0
    );
    const totalPoints = completed.reduce(
      (sum, b) => sum + (b.earned_points ?? 0),
      0
    );
    return {
      total: bookings.length,
      ongoing: ongoing.length,
      completed: completed.length,
      canceled: canceled.length,
      totalSpent,
      totalPoints,
    };
  }, [bookings]);

  if (!isHydrated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải" description="Vui lòng chờ..." />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Lịch sử đặt lịch"
          description="Đăng nhập để xem tất cả lịch hẹn và lịch sử rửa xe của bạn."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadPage(1, true);
            }}
          />
        }
        ListHeaderComponent={
          <View className="px-4 pt-5 pb-3">
            <Text className="text-2xl font-bold text-foreground">
              Lịch sử đặt lịch
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              Theo dõi tất cả lịch hẹn & tiến trình dịch vụ
            </Text>

            {/* Stats grid */}
            <View className="flex-row gap-2.5 mt-5">
              <View className="flex-1 rounded-2xl bg-card p-3">
                <Text className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Tổng
                </Text>
                <Text className="text-2xl font-bold text-foreground mt-1">
                  {stats.total}
                </Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  lịch hẹn
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-card p-3">
                <Text className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Hoàn thành
                </Text>
                <Text className="text-2xl font-bold text-emerald-600 mt-1">
                  {stats.completed}
                </Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  lần rửa
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-card p-3">
                <Text className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Điểm
                </Text>
                <View className="flex-row items-baseline gap-0.5 mt-1">
                  <Coins size={14} color="#a16207" strokeWidth={2.4} />
                  <Text className="text-2xl font-bold text-amber-600">
                    {stats.totalPoints}
                  </Text>
                </View>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  tích lũy
                </Text>
              </View>
            </View>

            {/* Filter tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingTop: 20, paddingBottom: 4 }}
            >
              <View className="flex-row items-center mr-1">
                <Filter size={12} color="#7a8599" strokeWidth={2.4} />
              </View>
              {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => {
                const count =
                  tab === "ALL"
                    ? stats.total
                    : tab === "ONGOING"
                    ? stats.ongoing
                    : tab === "COMPLETED"
                    ? stats.completed
                    : stats.canceled;
                const active = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${
                      active ? "bg-primary" : "bg-card border border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-foreground"
                      }`}
                    >
                      {TAB_LABELS[tab]}
                    </Text>
                    <View
                      className={`px-1.5 rounded-full ${
                        active ? "bg-white/20" : "bg-muted"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          active ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#1a5fd4" />
            </View>
          ) : (
            <View className="px-6 py-16 items-center">
              <Inbox size={48} color="#94a3b8" strokeWidth={1.5} />
              <Text className="text-sm font-semibold text-foreground mt-4">
                Chưa có lịch hẹn nào
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-1.5 leading-relaxed">
                Đặt lịch đầu tiên để bắt đầu trải nghiệm dịch vụ của Carivo.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/booking")}
                className="mt-5 rounded-full bg-primary px-5 py-2.5"
              >
                <Text className="text-white text-sm font-bold">
                  Đặt lịch ngay
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="px-4">
            <BookingCard
              booking={item}
              onPress={() =>
                router.push({
                  pathname: "/booking-detail",
                  params: { id: item.id },
                })
              }
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
