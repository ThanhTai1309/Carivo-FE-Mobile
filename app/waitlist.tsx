import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CircleCheck,
  CircleX,
  Clock4,
  Hourglass,
  Plus,
  SearchX,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import SkeletonCard from "@/components/common/SkeletonCard";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Waitlist } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

type TabValue = "WAITING" | "OFFERED" | "HISTORY";

const TABS: { value: TabValue; label: string; statuses: string[] }[] = [
  {
    value: "WAITING",
    label: "Đang chờ",
    statuses: ["WAITING"],
  },
  {
    value: "OFFERED",
    label: "Có slot",
    statuses: ["OFFERED"],
  },
  {
    value: "HISTORY",
    label: "Lịch sử",
    statuses: ["ACCEPTED", "CANCELED", "EXPIRED"],
  },
];

function WaitlistScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [allItems, setAllItems] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("WAITING");

  const load = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const response = await api.getWaitlists(accessToken, { limit: 50 });
        setAllItems(response.data ?? []);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải danh sách chờ.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated) void load();
  }, [isHydrated, isAuthenticated, load]);

  const counts = useMemo(() => {
    const result: Record<TabValue, number> = {
      WAITING: 0,
      OFFERED: 0,
      HISTORY: 0,
    };
    for (const item of allItems) {
      if (item.status === "WAITING") result.WAITING += 1;
      else if (item.status === "OFFERED") result.OFFERED += 1;
      else result.HISTORY += 1;
    }
    return result;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const tab = TABS.find((t) => t.value === activeTab);
    if (!tab) return [];
    return allItems.filter((i) => tab.statuses.includes(i.status));
  }, [allItems, activeTab]);

  if (!isHydrated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Danh sách chờ"
          description="Đăng nhập để xem các yêu cầu đang chờ slot trống."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-card items-center justify-center"
        >
          <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-foreground">
            Danh sách chờ slot
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Chờ garage mở slot cho dịch vụ bạn cần
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/waitlist/new", params: {} })
          }
          className="w-10 h-10 rounded-full bg-primary items-center justify-center"
        >
          <Plus size={18} color="#ffffff" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 gap-2 mb-3">
        {TABS.map((tab) => {
          const active = activeTab === tab.value;
          const count = counts[tab.value];
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              activeOpacity={0.85}
              className={`flex-1 rounded-2xl px-3 py-3 border ${
                active
                  ? "bg-primary border-primary"
                  : "bg-card border-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-foreground"
                }`}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              <Text
                className={`text-[10px] mt-0.5 ${
                  active ? "text-white/80" : "text-muted-foreground"
                }`}
              >
                {count} yêu cầu
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
          />
        }
      >
        <View className="px-4">
          {loading ? (
            <View className="gap-3">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center gap-2">
              <SearchX size={26} color="#94a3b8" strokeWidth={1.6} />
              <Text className="text-sm font-semibold text-foreground">
                {activeTab === "WAITING"
                  ? "Chưa có yêu cầu chờ slot"
                  : activeTab === "OFFERED"
                  ? "Chưa có slot trống"
                  : "Chưa có lịch sử"}
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                {activeTab === "WAITING"
                  ? "Bấm dấu + phía trên để thêm yêu cầu chờ."
                  : "Khi garage mở slot, bạn sẽ nhận được thông báo."}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {filteredItems.map((item) => (
                <WaitlistCard
                  key={item.id}
                  item={item}
                  onPress={() =>
                    router.push({
                      pathname: "/waitlist/[id]",
                      params: { id: item.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; icon: typeof Hourglass }> = {
    WAITING: {
      label: "Đang chờ",
      bg: "#dbe7fb",
      color: "#1a5fd4",
      icon: Hourglass,
    },
    OFFERED: {
      label: "Có slot",
      bg: "#fef3c7",
      color: "#a16207",
      icon: Bell,
    },
    ACCEPTED: {
      label: "Đã đặt",
      bg: "#dcfce7",
      color: "#15803d",
      icon: CircleCheck,
    },
    CANCELED: {
      label: "Đã huỷ",
      bg: "#fee2e2",
      color: "#b91c1c",
      icon: CircleX,
    },
    EXPIRED: {
      label: "Hết hạn",
      bg: "#f1f5f9",
      color: "#475569",
      icon: Clock4,
    },
  };
  const cfg = map[status] ?? map.WAITING;
  const Icon = cfg.icon;
  return (
    <View
      style={{ backgroundColor: cfg.bg }}
      className="flex-row items-center gap-1 self-start px-2 py-1 rounded-full"
    >
      <Icon size={11} color={cfg.color} strokeWidth={2.4} />
      <Text
        style={{ color: cfg.color }}
        className="text-[10px] font-bold"
      >
        {cfg.label}
      </Text>
    </View>
  );
}

function WaitlistCard({
  item,
  onPress,
}: {
  item: Waitlist;
  onPress: () => void;
}) {
  const garageName = item.garage?.name ?? "Garage";
  const serviceName = item.service_package?.name ?? "Dịch vụ";
  const vehiclePlate = item.vehicle?.raw_license_plate ?? "—";
  const desiredTime = formatDateTime(item.desired_start_time);
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="rounded-2xl bg-card border border-border p-4"
    >
      <View className="flex-row items-start justify-between gap-2 mb-2">
        <Text className="text-sm font-bold text-foreground flex-1" numberOfLines={1}>
          {serviceName}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
        {garageName}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <CalendarClock size={12} color="#7a8599" strokeWidth={2.2} />
          <Text className="text-xs text-muted-foreground">{desiredTime}</Text>
        </View>
        <Text className="text-xs font-semibold text-foreground">
          {vehiclePlate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function WaitlistScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="L?i danh s�ch ch?">
      <WaitlistScreen />
    </ErrorBoundary>
  );
}
