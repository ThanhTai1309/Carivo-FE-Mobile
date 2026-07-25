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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CarFront,
  CircleCheck,
  Clock4,
  Coins,
  CreditCard,
  MapPin,
  Receipt,
  Repeat,
  TimerReset,
  Wrench,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { WashHistory } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function HistoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const historyId = params.id;
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [history, setHistory] = useState<WashHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!accessToken || !historyId) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const response = await api.getWashHistory(accessToken, historyId);
        setHistory(response.data);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải chi tiết lần rửa.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, historyId]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated && historyId) {
      void load();
    }
  }, [isHydrated, isAuthenticated, historyId, load]);

  if (!isHydrated || loading) {
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
          title="Phiên đăng nhập đã hết"
          description="Vui lòng đăng nhập lại để xem chi tiết."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (!history) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="px-4 pt-3 pb-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
        <ScreenState
          title="Không tìm thấy"
          description="Lần rửa này có thể đã bị xoá."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const serviceName = history.service_package?.name ?? "Dịch vụ đã hoàn tất";
  const garageName = history.garage?.name ?? "Garage";
  const vehiclePlate = history.vehicle?.raw_license_plate ?? "—";
  const vehicleDesc = [history.vehicle?.brand, history.vehicle?.model]
    .filter(Boolean)
    .join(" ");

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
            Chi tiết lần rửa
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Mã: {history.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
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
        <View className="px-4 gap-4">
          {/* Hero */}
          <View className="rounded-2xl bg-card border border-border p-5">
            <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Dịch vụ
            </Text>
            <Text className="text-lg font-bold text-foreground mt-1">
              {serviceName}
            </Text>

            <View className="h-px bg-border my-4" />

            <View className="gap-3">
              <InfoRow icon={MapPin} label="Garage" value={garageName} />
              <InfoRow
                icon={CarFront}
                label="Phương tiện"
                value={`${vehiclePlate}${vehicleDesc ? ` • ${vehicleDesc}` : ""}`}
              />
              <InfoRow
                icon={Calendar}
                label="Ngày thanh toán"
                value={
                  history.paid_at ? formatDateTime(history.paid_at) : "—"
                }
              />
              {history.service_started_at ? (
                <InfoRow
                  icon={TimerReset}
                  label="Bắt đầu dịch vụ"
                  value={formatDateTime(history.service_started_at)}
                />
              ) : null}
              {history.service_completed_at ? (
                <InfoRow
                  icon={CircleCheck}
                  label="Hoàn thành"
                  value={formatDateTime(history.service_completed_at)}
                />
              ) : null}
              {history.payment_method ? (
                <InfoRow
                  icon={CreditCard}
                  label="Phương thức thanh toán"
                  value={history.payment_method}
                />
              ) : null}
            </View>
          </View>

          {/* Chi phí */}
          <View className="rounded-2xl bg-card border border-border p-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Receipt size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-base font-bold text-foreground">
                Chi tiết thanh toán
              </Text>
            </View>

            <View className="gap-2.5">
              {typeof history.original_price === "number" &&
              history.original_price > 0 ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">Giá gốc</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {formatCurrency(history.original_price)}
                  </Text>
                </View>
              ) : null}

              {history.discount_amount > 0 ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Giảm giá
                  </Text>
                  <Text className="text-sm font-medium text-emerald-600">
                    −{formatCurrency(history.discount_amount)}
                  </Text>
                </View>
              ) : null}

              {history.points_used > 0 ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted-foreground">
                    Điểm đã dùng
                  </Text>
                  <Text className="text-sm font-medium text-amber-700">
                    −{history.points_used} điểm
                  </Text>
                </View>
              ) : null}

              <View className="h-px bg-border my-1" />

              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">
                  Thành tiền
                </Text>
                <Text className="text-lg font-bold text-primary">
                  {formatCurrency(history.amount_paid)}
                </Text>
              </View>

              {history.points_earned > 0 ? (
                <View className="mt-2 rounded-xl bg-amber-50 p-3 flex-row items-center gap-2.5">
                  <Coins size={18} color="#a16207" strokeWidth={2.4} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-amber-800">
                      Điểm thưởng tích lũy
                    </Text>
                    <Text className="text-[11px] text-amber-700 mt-0.5">
                      Lần rửa này giúp bạn tích lũy điểm vào tài khoản.
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-amber-700">
                    +{history.points_earned}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Wash bay (nếu có) */}
          {history.wash_bay ? (
            <View className="rounded-2xl bg-card border border-border p-4 flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                <Wrench size={18} color="#1a5fd4" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">
                  Wash bay sử dụng
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {history.wash_bay.name}
                  {history.wash_bay.bay_code
                    ? ` · ${history.wash_bay.bay_code}`
                    : ""}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Rebook */}
          {history.service_package && history.garage ? (
            <LoadingButton
              title="Đặt lại dịch vụ này"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/booking",
                  params: {
                    garageId: history.garage?.id,
                    servicePackageId: history.service_package?.id,
                    vehicleId: history.vehicle?.id ?? undefined,
                  },
                })
              }
              icon={Repeat}
              variant="primary"
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
        <Icon size={16} color="#1a5fd4" strokeWidth={2.2} />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </Text>
        <Text className="text-sm font-semibold text-foreground mt-0.5">
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryDetailScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi chi tiết lần rửa">
      <HistoryDetailScreen />
    </ErrorBoundary>
  );
}
