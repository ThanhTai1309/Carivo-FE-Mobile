import { useCallback, useEffect, useState } from "react";
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
  Calendar,
  CarFront,
  Coins,
  History,
  MapPin,
  RotateCcw,
  Sparkles,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import SkeletonCard from "@/components/common/SkeletonCard";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { api, ApiError } from "@/lib/api";
import { compactName, formatCurrency, formatDateTime } from "@/lib/format";
import type { WashHistory } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function HistoryScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [histories, setHistories] = useState<WashHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const loadHistories = useCallback(
    async (silent = false) => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const response = await api.getWashHistories(accessToken, {
          limit: 50,
          sort: "-paid_at",
        });
        setHistories(response.data ?? []);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải lịch sử rửa xe.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      void loadHistories();
    }
  }, [isHydrated, isAuthenticated, loadHistories]);

  const handleClaim = async () => {
    if (!accessToken) return;
    setClaiming(true);
    try {
      const result = await api.claimWashHistory(accessToken);
      const claimed = result.data.claimed_bookings;
      setClaimMessage(
        claimed > 0
          ? `Đã đồng bộ ${result.data.claimed_wash_histories} lượt sử dụng và cộng ${result.data.awarded_points.toLocaleString("vi-VN")} điểm thưởng.`
          : "Không có lịch sử walk-in nào cần đồng bộ."
      );
      await loadHistories(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể đồng bộ lịch sử walk-in.";
      Alert.alert("Lỗi", message);
    } finally {
      setClaiming(false);
    }
  };

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
          title="Lịch sử rửa xe"
          description="Đăng nhập để xem lịch sử rửa xe và các ưu đãi tích lũy."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  const totalEarned = histories.reduce(
    (sum, item) => sum + (item.points_earned || 0),
    0
  );
  const totalSpent = histories.reduce(
    (sum, item) => sum + (item.amount_paid || 0),
    0
  );

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
            Lịch sử rửa xe
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Tổng quan các lần rửa đã hoàn tất
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHistories(true)}
          />
        }
      >
        <View className="px-4 gap-4">
          {/* Stats */}
          <View className="rounded-2xl bg-card border border-border p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Sparkles size={16} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="text-sm font-semibold text-foreground">
                Tổng kết
              </Text>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Số lần rửa</Text>
                <Text className="text-2xl font-bold text-primary mt-1">
                  {histories.length}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Điểm thưởng</Text>
                <Text className="text-2xl font-bold text-amber-700 mt-1">
                  +{totalEarned}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Tổng chi</Text>
                <Text className="text-base font-bold text-foreground mt-1">
                  {formatCurrency(totalSpent)}
                </Text>
              </View>
            </View>
          </View>

          {/* Claim banner */}
          <View className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <RotateCcw size={16} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="text-sm font-bold text-blue-800">
                Đồng bộ lịch sử walk-in
              </Text>
            </View>
            <Text className="text-xs text-blue-700 leading-5 mb-3">
              Nếu trước đây bạn rửa xe mà không đăng nhập, hãy nhấn nút bên
              dưới để đồng bộ các lần rửa walk-in vào tài khoản.
            </Text>
            <LoadingButton
              title="Đồng bộ ngay"
              loadingTitle="Đang đồng bộ..."
              loading={claiming}
              onPress={handleClaim}
              variant="secondary"
              fullWidth={false}
            />
            {claimMessage ? (
              <Text className="text-xs text-blue-700 mt-2 leading-5">
                {claimMessage}
              </Text>
            ) : null}
          </View>

          {/* List */}
          <View>
            <View className="flex-row items-center gap-2 mb-3">
              <History size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-sm font-bold text-foreground">
                Lần rửa gần đây
              </Text>
            </View>
            {loading ? (
              <View className="gap-3">
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </View>
            ) : histories.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-border bg-card p-5 items-center gap-2">
                <CarFront size={26} color="#94a3b8" strokeWidth={1.6} />
                <Text className="text-sm font-semibold text-foreground">
                  Chưa có lịch sử rửa
                </Text>
                <Text className="text-xs text-muted-foreground text-center">
                  Sau khi hoàn tất dịch vụ đầu tiên, lịch sử sẽ hiển thị ở đây.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {histories.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/history/[id]",
                        params: { id: h.id },
                      })
                    }
                    className="rounded-2xl bg-card border border-border p-4"
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text
                          className="text-sm font-bold text-foreground"
                          numberOfLines={1}
                        >
                          {h.service_package?.name ?? "Dịch vụ đã hoàn tất"}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-1">
                          <MapPin size={12} color="#7a8599" strokeWidth={2.2} />
                          <Text
                            className="text-xs text-muted-foreground flex-1"
                            numberOfLines={1}
                          >
                            {h.garage?.name ?? "Garage"}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1 mt-1">
                          <CarFront
                            size={12}
                            color="#7a8599"
                            strokeWidth={2.2}
                          />
                          <Text
                            className="text-xs text-muted-foreground flex-1"
                            numberOfLines={1}
                          >
                            {h.vehicle?.raw_license_plate ?? "—"}
                            {h.vehicle?.brand
                              ? ` · ${compactName(`${h.vehicle.brand} ${h.vehicle.model ?? ""}`)}`
                              : ""}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1 mt-1">
                          <Calendar
                            size={12}
                            color="#7a8599"
                            strokeWidth={2.2}
                          />
                          <Text className="text-xs text-muted-foreground">
                            {formatDateTime(
                              h.paid_at ?? h.service_completed_at ?? h.created_at ?? new Date().toISOString()
                            )}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-base font-bold text-primary">
                          {formatCurrency(h.amount_paid)}
                        </Text>
                        {h.points_earned ? (
                          <View className="flex-row items-center gap-1 mt-1">
                            <Coins size={12} color="#a16207" strokeWidth={2.2} />
                            <Text className="text-[11px] font-semibold text-amber-700">
                              +{h.points_earned} điểm
                            </Text>
                          </View>
                        ) : null}
                        {h.discount_amount > 0 ? (
                          <Text className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            −{formatCurrency(h.discount_amount)} KM
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HistoryScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="L?i l?ch s? r?a xe">
      <HistoryScreen />
    </ErrorBoundary>
  );
}
