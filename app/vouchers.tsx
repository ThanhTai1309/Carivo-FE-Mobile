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
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Gift,
  Sparkles,
  TicketPercent,
  Ticket,
  Wallet,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CustomerVoucher, VoucherStatus } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

type Tab = "ACTIVE" | "REDEEMED" | "EXPIRED";

const TAB_LABELS: Record<Tab, string> = {
  ACTIVE: "Có thể dùng",
  REDEEMED: "Đã dùng",
  EXPIRED: "Hết hạn",
};

function formatVoucherValue(voucher: CustomerVoucher): string {
  if (
    voucher.discount_type === "PERCENTAGE" &&
    typeof voucher.discount_value === "number"
  ) {
    const max = voucher.max_discount_amount ?? null;
    const head = `Giảm ${voucher.discount_value}%`;
    return max ? `${head} · Tối đa ${formatCurrency(max)}` : head;
  }
  if (typeof voucher.discount_value === "number") {
    return `Giảm ${formatCurrency(voucher.discount_value)}`;
  }
  if (voucher.kind === "FREE_SERVICE") return "Miễn phí dịch vụ";
  if (voucher.kind === "CASHBACK") return "Hoàn tiền";
  return "Ưu đãi đặc biệt";
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}

function VoucherCard({
  voucher,
  onTap,
}: {
  voucher: CustomerVoucher;
  onTap: () => void;
}) {
  const remaining = daysUntil(voucher.expires_at);
  const isExpired = (voucher.expires_at &&
    new Date(voucher.expires_at).getTime() < Date.now()) ||
    voucher.status === "EXPIRED" ||
    voucher.status === "CANCELED";
  const isRedeemed = voucher.status === "REDEEMED";
  const muted = isExpired || isRedeemed;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onTap}
      className={`rounded-2xl border p-4 flex-row gap-3 ${
        muted
          ? "bg-muted border-border opacity-70"
          : "bg-card border-border"
      }`}
    >
      <View
        className={`w-14 h-14 rounded-2xl items-center justify-center ${
          muted ? "bg-background" : "bg-secondary"
        }`}
      >
        <TicketPercent
          size={26}
          color={muted ? "#94a3b8" : "#1a56db"}
          strokeWidth={2.2}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className={`text-sm font-bold ${
              muted ? "text-muted-foreground" : "text-foreground"
            }`}
            numberOfLines={1}
          >
            {voucher.name || voucher.code}
          </Text>
        </View>
        <Text
          className={`text-xs mt-0.5 font-semibold ${
            muted ? "text-muted-foreground" : "text-primary"
          }`}
        >
          {formatVoucherValue(voucher)}
        </Text>
        {voucher.description ? (
          <Text
            className="text-xs text-muted-foreground mt-1 leading-relaxed"
            numberOfLines={2}
          >
            {voucher.description}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2 mt-2 flex-wrap">
          <View className="rounded-full bg-secondary px-2 py-0.5">
            <Text className="text-[10px] font-mono font-bold text-primary">
              {voucher.code}
            </Text>
          </View>
          {voucher.expires_at && !isRedeemed ? (
            <View className="flex-row items-center gap-1">
              <Calendar size={11} color="#7a8599" strokeWidth={2.2} />
              <Text className="text-[11px] text-muted-foreground">
                HSD {formatDateTime(voucher.expires_at).split(" ")[0]}
              </Text>
            </View>
          ) : null}
          {remaining !== null && remaining > 0 && remaining <= 7 && !muted ? (
            <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              <Clock size={11} color="#a16207" strokeWidth={2.2} />
              <Text className="text-[10px] font-bold text-amber-700">
                Còn {remaining} ngày
              </Text>
            </View>
          ) : null}
          {isRedeemed ? (
            <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Ticket size={11} color="#15803d" strokeWidth={2.2} />
              <Text className="text-[10px] font-bold text-emerald-700">
                Đã dùng
              </Text>
            </View>
          ) : null}
          {isExpired ? (
            <View className="flex-row items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
              <Clock size={11} color="#b91c1c" strokeWidth={2.2} />
              <Text className="text-[10px] font-bold text-red-700">
                Hết hạn
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VouchersScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("ACTIVE");

  const loadVouchers = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.getMyVouchers(accessToken);
      setVouchers(response.data ?? []);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể tải danh sách voucher.";
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated) {
      void loadVouchers();
    }
  }, [isHydrated, loadVouchers]);

  useFocusEffect(
    useCallback(() => {
      if (isHydrated && isAuthenticated) {
        void loadVouchers();
      }
    }, [isHydrated, isAuthenticated, loadVouchers])
  );

  const counts = useMemo(() => {
    let active = 0;
    let redeemed = 0;
    let expired = 0;
    for (const v of vouchers) {
      const isExpired =
        (v.expires_at && new Date(v.expires_at).getTime() < Date.now()) ||
        v.status === "EXPIRED" ||
        v.status === "CANCELED";
      if (v.status === "REDEEMED") redeemed++;
      else if (isExpired) expired++;
      else active++;
    }
    return { active, redeemed, expired, total: vouchers.length };
  }, [vouchers]);

  const filtered = useMemo(() => {
    return vouchers
      .filter((v) => {
        const isExpired =
          (v.expires_at && new Date(v.expires_at).getTime() < Date.now()) ||
          v.status === "EXPIRED" ||
          v.status === "CANCELED";
        if (activeTab === "ACTIVE") return !isExpired && v.status !== "REDEEMED";
        if (activeTab === "REDEEMED") return v.status === "REDEEMED";
        return isExpired;
      })
      .sort((a, b) => {
        const aDate = a.expires_at ? new Date(a.expires_at).getTime() : 0;
        const bDate = b.expires_at ? new Date(b.expires_at).getTime() : 0;
        return aDate - bDate;
      });
  }, [vouchers, activeTab]);

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
          title="Ví voucher"
          description="Đăng nhập để xem các voucher được Carivo tặng và sử dụng khi đặt lịch."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-card items-center justify-center"
        >
          <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-foreground">Ví voucher</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Quà tặng & ưu đãi đặc biệt dành cho bạn
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadVouchers();
            }}
          />
        }
      >
        {/* Hero card */}
        <View className="mx-4 mt-2 rounded-3xl overflow-hidden bg-primary p-5">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
              <Wallet size={24} color="#ffffff" strokeWidth={2.2} />
            </View>
            <View>
              <Text className="text-xs text-white/80 font-semibold tracking-wide">
                TỔNG VOUCHER KHẢ DỤNG
              </Text>
              <Text className="text-3xl font-bold text-white mt-0.5">
                {counts.active}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1 bg-white/10 rounded-2xl px-3 py-2">
              <Text className="text-[10px] text-white/70 font-semibold uppercase">
                Đã dùng
              </Text>
              <Text className="text-base font-bold text-white">
                {counts.redeemed}
              </Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-2xl px-3 py-2">
              <Text className="text-[10px] text-white/70 font-semibold uppercase">
                Hết hạn
              </Text>
              <Text className="text-base font-bold text-white">
                {counts.expired}
              </Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-2xl px-3 py-2">
              <Text className="text-[10px] text-white/70 font-semibold uppercase">
                Tổng
              </Text>
              <Text className="text-base font-bold text-white">
                {counts.total}
              </Text>
            </View>
          </View>
        </View>

        {/* Helper */}
        <View className="mx-4 mt-4 rounded-xl bg-secondary px-4 py-3 flex-row gap-2.5 items-start">
          <Sparkles size={16} color="#1a56db" strokeWidth={2.2} />
          <Text className="flex-1 text-xs text-primary leading-5">
            Mỗi voucher bắt đầu bằng <Text className="font-bold">CARE_</Text>.
            Khi đặt lịch, chọn dịch vụ rồi nhập mã ở bước thanh toán để được trừ
            trực tiếp vào đơn.
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 16 }}
        >
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
            const count =
              tab === "ACTIVE"
                ? counts.active
                : tab === "REDEEMED"
                ? counts.redeemed
                : counts.expired;
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

        {/* List */}
        <View className="px-4 gap-3">
          {loading ? (
            <View className="py-12 items-center">
              <Text className="text-sm text-muted-foreground">Đang tải...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center gap-2">
              <Gift size={28} color="#94a3b8" strokeWidth={1.6} />
              <Text className="text-sm font-semibold text-foreground">
                {activeTab === "ACTIVE"
                  ? "Chưa có voucher khả dụng"
                  : activeTab === "REDEEMED"
                  ? "Chưa dùng voucher nào"
                  : "Chưa có voucher hết hạn"}
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                {activeTab === "ACTIVE"
                  ? "Hệ thống sẽ tặng voucher cho bạn sau khi hoàn tất dịch vụ. Quay lại sau nhé!"
                  : "Voucher của bạn sẽ xuất hiện tại đây."}
              </Text>
              {activeTab === "ACTIVE" ? (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/booking")}
                  className="mt-3 rounded-full bg-primary px-4 py-2"
                >
                  <Text className="text-white text-xs font-bold">
                    Đặt lịch để nhận ưu đãi
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            filtered.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onTap={() => {
                  Alert.alert(
                    `Mã voucher: ${voucher.code}`,
                    `${voucher.description ?? "Không có mô tả."}\n\nHạn sử dụng: ${
                      voucher.expires_at
                        ? formatDateTime(voucher.expires_at)
                        : "Không giới hạn"
                    }`
                  );
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

void VoucherCard;
