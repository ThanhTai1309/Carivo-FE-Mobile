import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
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
  Ticket,
  TicketPercent,
  Wallet,
  X,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CustomerVoucher, Promotion } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

type VoucherUiStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "PENDING"
  | "USED"
  | "EXPIRED"
  | "REVOKED";

const STATUS_LABEL: Record<VoucherUiStatus, string> = {
  AVAILABLE: "Có thể dùng",
  RESERVED: "Đang giữ chỗ",
  PENDING: "Chờ duyệt",
  USED: "Đã dùng",
  EXPIRED: "Hết hạn",
  REVOKED: "Đã thu hồi",
};

const STATUS_STYLE: Record<
  VoucherUiStatus,
  { bg: string; text: string; border: string; muted: boolean }
> = {
  AVAILABLE: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    muted: false,
  },
  RESERVED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    muted: false,
  },
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    muted: false,
  },
  USED: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    muted: true,
  },
  EXPIRED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    muted: true,
  },
  REVOKED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    muted: true,
  },
};

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}

function formatPromotionValue(p: Promotion): string {
  const max = p.max_discount_amount ?? null;
  if (p.discount_type === "PERCENTAGE") {
    const head = `Giảm ${p.discount_value}%`;
    return max ? `${head} · Tối đa ${formatCurrency(max)}` : head;
  }
  const head = `Giảm ${formatCurrency(p.discount_value)}`;
  return max ? `${head} · Tối đa ${formatCurrency(max)}` : head;
}

function resolveVoucherStatus(voucher: CustomerVoucher): VoucherUiStatus {
  if (voucher.status === "REVOKED") return "REVOKED";
  if (voucher.status === "USED") return "USED";
  if (voucher.status === "RESERVED") return "RESERVED";
  if (voucher.status === "PENDING_APPROVAL") return "PENDING";
  if (voucher.status === "EXPIRED") return "EXPIRED";
  if (voucher.expires_at) {
    const t = new Date(voucher.expires_at).getTime();
    if (!Number.isNaN(t) && t < Date.now()) return "EXPIRED";
  }
  return "AVAILABLE";
}

function resolvePromotionStatus(p: Promotion): VoucherUiStatus {
  if (p.is_active === false) return "EXPIRED";
  const now = Date.now();
  if (p.start_at) {
    const s = new Date(p.start_at).getTime();
    if (!Number.isNaN(s) && now < s) return "PENDING";
  }
  if (p.end_at) {
    const e = new Date(p.end_at).getTime();
    if (!Number.isNaN(e) && now > e) return "EXPIRED";
  }
  if (
    typeof p.usage_limit === "number" &&
    typeof p.usage_count === "number" &&
    p.usage_limit > 0 &&
    p.usage_count >= p.usage_limit
  ) {
    return "EXPIRED";
  }
  return "AVAILABLE";
}

// Unified item type cho danh sách hiển thị
interface VoucherListItem {
  kind: "PROMOTION" | "CUSTOMER_VOUCHER";
  code: string;
  title: string;
  valueLabel: string;
  description: string | null;
  expiresAt: string | null;
  status: VoucherUiStatus;
  raw: Promotion | CustomerVoucher;
}

function buildItemFromPromotion(p: Promotion): VoucherListItem {
  return {
    kind: "PROMOTION",
    code: p.code,
    title: p.name,
    valueLabel: formatPromotionValue(p),
    description: p.description ?? null,
    expiresAt: p.end_at ?? null,
    status: resolvePromotionStatus(p),
    raw: p,
  };
}

function buildItemFromCustomerVoucher(
  v: CustomerVoucher
): VoucherListItem {
  const title =
    v.service_package?.name || v.note || v.code;
  let valueLabel: string;
  if (v.voucher_type === "FREE_SERVICE") valueLabel = "Miễn phí dịch vụ";
  else if (typeof v.value !== "number") valueLabel = "Ưu đãi đặc biệt";
  else if (v.voucher_type === "PERCENTAGE") {
    const head = `Giảm ${v.value}%`;
    valueLabel = v.max_discount_amount
      ? `${head} · Tối đa ${formatCurrency(v.max_discount_amount)}`
      : head;
  } else {
    const head = `Giảm ${formatCurrency(v.value)}`;
    valueLabel = v.max_discount_amount
      ? `${head} · Tối đa ${formatCurrency(v.max_discount_amount)}`
      : head;
  }
  return {
    kind: "CUSTOMER_VOUCHER",
    code: v.code,
    title,
    valueLabel,
    description: v.note ?? null,
    expiresAt: v.expires_at ?? null,
    status: resolveVoucherStatus(v),
    raw: v,
  };
}

function StatusBadge({ status }: { status: VoucherUiStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <View
      className={`self-start rounded-full px-2 py-0.5 ${s.bg} border ${s.border}`}
    >
      <Text className={`text-[10px] font-bold ${s.text}`}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

function KindBadge({ kind }: { kind: "PROMOTION" | "CUSTOMER_VOUCHER" }) {
  if (kind === "PROMOTION") {
    return (
      <View className="self-start rounded-full px-2 py-0.5 bg-primary/10 border border-primary/20">
        <Text className="text-[10px] font-bold text-primary">KHUYẾN MÃI</Text>
      </View>
    );
  }
  return (
    <View className="self-start rounded-full px-2 py-0.5 bg-secondary border border-primary/20">
      <Text className="text-[10px] font-bold text-primary">VOUCHER CỦA TÔI</Text>
    </View>
  );
}

function VoucherCard({
  item,
  onTap,
}: {
  item: VoucherListItem;
  onTap: () => void;
}) {
  const style = STATUS_STYLE[item.status];
  const muted = style.muted;
  const remaining = daysUntil(item.expiresAt);
  const expiringSoon =
    remaining !== null && remaining > 0 && remaining <= 7 && !muted;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onTap}
      className={`rounded-2xl border p-4 gap-3 ${
        muted ? "bg-muted border-border opacity-70" : "bg-card border-border"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`w-11 h-11 rounded-xl items-center justify-center ${
            muted ? "bg-background" : "bg-secondary"
          }`}
        >
          {item.kind === "PROMOTION" ? (
            <Sparkles
              size={20}
              color={muted ? "#94a3b8" : "#1a56db"}
              strokeWidth={2.2}
            />
          ) : (
            <TicketPercent
              size={20}
              color={muted ? "#94a3b8" : "#1a56db"}
              strokeWidth={2.2}
            />
          )}
        </View>
        <View className="flex-1 gap-1">
          <Text
            className={`text-sm font-bold leading-snug ${
              muted ? "text-muted-foreground" : "text-foreground"
            }`}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            className={`text-xs font-semibold ${
              muted ? "text-muted-foreground" : "text-primary"
            }`}
          >
            {item.valueLabel}
          </Text>
        </View>
        <View className="gap-1.5 items-end">
          <KindBadge kind={item.kind} />
          <StatusBadge status={item.status} />
        </View>
      </View>

      {item.description ? (
        <Text
          className="text-xs text-muted-foreground leading-relaxed"
          numberOfLines={3}
        >
          {item.description}
        </Text>
      ) : null}

      <View className="flex-row items-center gap-2 flex-wrap">
        <View className="rounded-full bg-secondary px-2 py-0.5">
          <Text className="text-[10px] font-mono font-bold text-primary">
            {item.code}
          </Text>
        </View>
        {item.expiresAt ? (
          <View className="flex-row items-center gap-1">
            <Calendar size={11} color="#7a8599" strokeWidth={2.2} />
            <Text className="text-[11px] text-muted-foreground">
              HSD {formatDateTime(item.expiresAt).split(" ")[0]}
            </Text>
          </View>
        ) : null}
        {expiringSoon ? (
          <View className="flex-row items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5">
            <Clock size={11} color="#a16207" strokeWidth={2.2} />
            <Text className="text-[10px] font-bold text-amber-700">
              Còn {remaining} ngày
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function DetailRow({ label, value, emphasis }: DetailRowProps) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text
        className={`text-xs text-right flex-1 ${
          emphasis ? "font-bold text-primary" : "text-foreground"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function VoucherDetailModal({
  item,
  visible,
  onClose,
}: {
  item: VoucherListItem | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  const style = STATUS_STYLE[item.status];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40 justify-end"
      >
        <Pressable
          onPress={() => {}}
          className="bg-background rounded-t-3xl max-h-[88%]"
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 rounded-full bg-muted" />
          </View>

          <View className="flex-row items-start px-5 pt-3 pb-4 gap-3">
            <View className="w-12 h-12 rounded-2xl bg-secondary items-center justify-center">
              {item.kind === "PROMOTION" ? (
                <Sparkles size={22} color="#1a56db" strokeWidth={2.2} />
              ) : (
                <TicketPercent size={22} color="#1a56db" strokeWidth={2.2} />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground" numberOfLines={2}>
                {item.title}
              </Text>
              <Text className="text-sm text-primary font-semibold mt-1">
                {item.valueLabel}
              </Text>
              <View className="mt-1.5">
                <KindBadge kind={item.kind} />
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-9 h-9 rounded-full bg-card items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <X size={18} color="#1a1a1a" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <View className="mx-5 mb-3">
            <View
              className={`rounded-xl px-3 py-2 ${style.bg} border ${style.border}`}
            >
              <Text className={`text-xs font-bold ${style.text}`}>
                Trạng thái: {STATUS_LABEL[item.status]}
              </Text>
            </View>
          </View>

          {item.description ? (
            <View className="mx-5 mb-3">
              <Text className="text-xs font-bold text-muted-foreground tracking-wide mb-1.5">
                MÔ TẢ
              </Text>
              <View className="rounded-xl bg-card border border-border p-3">
                <Text className="text-sm text-foreground leading-relaxed">
                  {item.description}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="mx-5 mb-4">
            <Text className="text-xs font-bold text-muted-foreground tracking-wide mb-1.5">
              THÔNG TIN
            </Text>
            <View className="rounded-xl bg-card border border-border px-3 divide-y divide-border">
              <DetailRow label="Mã" value={item.code} emphasis />
              <DetailRow label="Giá trị" value={item.valueLabel} />
              <DetailRow
                label="Loại"
                value={
                  item.kind === "PROMOTION"
                    ? "Khuyến mãi công khai"
                    : "Voucher cá nhân"
                }
              />
              <DetailRow
                label="Hạn sử dụng"
                value={
                  item.expiresAt
                    ? formatDateTime(item.expiresAt)
                    : "Không giới hạn"
                }
              />
              <DetailRow
                label="Trạng thái"
                value={STATUS_LABEL[item.status]}
              />
              {item.kind === "PROMOTION"
                ? (() => {
                    const p = item.raw as Promotion;
                    return (
                      <>
                        {p.min_order_amount ? (
                          <DetailRow
                            label="Đơn tối thiểu"
                            value={formatCurrency(p.min_order_amount)}
                          />
                        ) : null}
                        {p.applicable_vehicle_types &&
                        p.applicable_vehicle_types.length > 0 ? (
                          <DetailRow
                            label="Loại xe"
                            value={p.applicable_vehicle_types.join(", ")}
                          />
                        ) : null}
                        {p.usage_limit ? (
                          <DetailRow
                            label="Lượt dùng"
                            value={`${p.usage_count ?? 0} / ${p.usage_limit}`}
                          />
                        ) : null}
                      </>
                    );
                  })()
                : (() => {
                    const v = item.raw as CustomerVoucher;
                    return (
                      <>
                        {v.min_order_amount ? (
                          <DetailRow
                            label="Đơn tối thiểu"
                            value={formatCurrency(v.min_order_amount)}
                          />
                        ) : null}
                        {v.garage?.name ? (
                          <DetailRow
                            label="Garage áp dụng"
                            value={`${v.garage.name}${
                              v.garage.garage_code
                                ? ` · ${v.garage.garage_code}`
                                : ""
                            }`}
                          />
                        ) : null}
                        {v.service_package?.name ? (
                          <DetailRow
                            label="Dịch vụ"
                            value={v.service_package.name}
                          />
                        ) : null}
                      </>
                    );
                  })()}
            </View>
          </View>

          <View className="mx-5 mb-6 rounded-xl bg-secondary px-4 py-3">
            <Text className="text-xs text-primary leading-relaxed">
              {item.kind === "PROMOTION"
                ? "Khuyến mãi công khai: nhập mã khi thanh toán để được giảm trực tiếp vào đơn."
                : "Voucher cá nhân: mỗi mã chỉ dùng được một lần. Nhập mã khi thanh toán để được giảm."}{" "}
              Mã: <Text className="font-bold">{item.code}</Text>.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function VouchersScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();
  const [items, setItems] = useState<VoucherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<VoucherListItem | null>(null);

  const loadAll = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      // Song song — promotion không cần token (public), voucher cần token.
      // Lưu ý: getPromotions public endpoint KHÔNG chấp nhận query is_active
      // (schema strict). BE đã tự filter valid_only=true.
      const [promoRes, voucherRes] = await Promise.allSettled([
        api.getPromotions({ limit: 100 }),
        api.getMyVouchers(accessToken),
      ]);

      const promotions: Promotion[] =
        promoRes.status === "fulfilled" ? promoRes.value.data ?? [] : [];
      const vouchers: CustomerVoucher[] =
        voucherRes.status === "fulfilled" ? voucherRes.value.data ?? [] : [];

      const merged: VoucherListItem[] = [
        ...promotions.map(buildItemFromPromotion),
        ...vouchers.map(buildItemFromCustomerVoucher),
      ];
      setItems(merged);

      if (promoRes.status === "rejected") {
        console.warn("[Vouchers] promotions load failed:", promoRes.reason);
      }
      if (voucherRes.status === "rejected") {
        console.warn("[Vouchers] vouchers load failed:", voucherRes.reason);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể tải danh sách voucher.";
      console.warn("[Vouchers] load error:", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated) {
      void loadAll();
    }
  }, [isHydrated, loadAll]);

  useFocusEffect(
    useCallback(() => {
      if (isHydrated && isAuthenticated) {
        void loadAll();
      }
    }, [isHydrated, isAuthenticated, loadAll])
  );

  const sorted = useMemo(() => {
    const priority: Record<VoucherUiStatus, number> = {
      AVAILABLE: 0,
      RESERVED: 1,
      PENDING: 2,
      USED: 3,
      EXPIRED: 4,
      REVOKED: 5,
    };
    return [...items].sort((a, b) => {
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      const aDate = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
      const bDate = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      return aDate - bDate;
    });
  }, [items]);

  const counts = useMemo(() => {
    let promotions = 0;
    let personal = 0;
    let available = 0;
    for (const it of items) {
      if (it.kind === "PROMOTION") promotions++;
      else personal++;
      if (it.status === "AVAILABLE") available++;
    }
    return { promotions, personal, available };
  }, [items]);

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
          description="Đăng nhập để xem các khuyến mãi và voucher của bạn."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  const total = items.length;

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
            Tất cả khuyến mãi & voucher của bạn
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
              void loadAll();
            }}
          />
        }
      >
        {/* Compact hero */}
        <View className="mx-4 mt-2 rounded-2xl bg-primary px-4 py-3 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
            <Wallet size={20} color="#ffffff" strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] text-white/80 font-semibold tracking-wide">
              TỔNG VOUCHER
            </Text>
            <Text className="text-lg font-bold text-white">
              {total} mã trong ví
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] text-white/80 font-semibold">
              Khuyến mãi: {counts.promotions}
            </Text>
            <Text className="text-[10px] text-white/80 font-semibold mt-0.5">
              Voucher cá nhân: {counts.personal}
            </Text>
          </View>
        </View>

        {/* Hint */}
        <View className="mx-4 mt-4 rounded-xl bg-secondary px-4 py-3 flex-row gap-2.5 items-start">
          <Sparkles size={16} color="#1a56db" strokeWidth={2.2} />
          <Text className="flex-1 text-xs text-primary leading-5">
            Bấm vào từng mã để xem chi tiết. Mã khuyến mãi áp dụng được ngay khi
            thanh toán; voucher cá nhân chỉ dùng được một lần.
          </Text>
        </View>

        {/* List */}
        <View className="px-4 mt-4 gap-3">
          {loading ? (
            <View className="py-12 items-center">
              <Text className="text-sm text-muted-foreground">Đang tải...</Text>
            </View>
          ) : total === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center gap-2">
              <Gift size={28} color="#94a3b8" strokeWidth={1.6} />
              <Text className="text-sm font-semibold text-foreground">
                Ví voucher đang trống
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                Carivo sẽ tặng voucher cho bạn sau khi hoàn tất dịch vụ hoặc qua
                các chương trình ưu đãi. Quay lại sau nhé!
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/booking")}
                className="mt-3 rounded-full bg-primary px-4 py-2"
              >
                <Text className="text-white text-xs font-bold">
                  Đặt lịch để nhận ưu đãi
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            sorted.map((item, idx) => (
              <VoucherCard
                key={`${item.kind}-${item.code}-${idx}`}
                item={item}
                onTap={() => setDetail(item)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <VoucherDetailModal
        item={detail}
        visible={detail !== null}
        onClose={() => setDetail(null)}
      />
    </SafeAreaView>
  );
}

void Ticket;