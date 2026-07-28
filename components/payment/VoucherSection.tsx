import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Check,
  Lock,
  Ticket,
  TicketPercent,
  X,
} from "lucide-react-native";
import type { Promotion, VehicleType } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export interface AppliedPromotion {
  promotion: Promotion;
  discountAmount: number;
  finalPrice: number;
}

export interface AppliedVoucher {
  code: string;
  discountAmount: number;
  voucherId?: string;
  expiresAt?: string | null;
}

interface VoucherSectionProps {
  promotions: Promotion[];
  servicePackageId: string;
  servicePrice: number;
  vehicleType?: VehicleType;
  isAuthenticated: boolean;
  loading?: boolean;
  applied?: AppliedPromotion | null;
  appliedVoucher?: AppliedVoucher | null;
  onAppliedChange: (applied: AppliedPromotion | null) => void;
  onVoucherChange?: (applied: AppliedVoucher | null) => void;
  onError?: (message: string) => void;
  onValidate: (
    promotionCode: string
  ) => Promise<AppliedPromotion | { error: string }>;
  onValidateVoucher?: (
    voucherCode: string
  ) => Promise<AppliedVoucher | { error: string }>;
  validatingVoucher?: boolean;
}

function formatExpiry(promo: Promotion): string {
  const end = promo.end_at;
  if (!end) return "Không giới hạn";
  const date = new Date(end);
  if (Number.isNaN(date.getTime())) return "Không giới hạn";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `Hết hạn: ${day}/${month}/${year}`;
}

function buildDiscountLabel(promo: Promotion): string {
  if (promo.discount_type === "PERCENTAGE") {
    const max = promo.max_discount_amount ?? null;
    const head = `Giảm ${promo.discount_value}%`;
    return max ? `${head} · Tối đa ${formatCurrency(max)}` : head;
  }
  return `Giảm ${formatCurrency(promo.discount_value)}`;
}

function isPromotionApplicable(
  promo: Promotion,
  servicePackageId: string,
  servicePrice: number,
  vehicleType?: VehicleType
): { ok: boolean; reason?: string } {
  if (promo.is_active === false) {
    return { ok: false, reason: "Mã đang tạm dừng" };
  }

  const now = Date.now();
  if (promo.start_at) {
    const start = new Date(promo.start_at).getTime();
    if (!Number.isNaN(start) && now < start) {
      return { ok: false, reason: "Mã chưa bắt đầu" };
    }
  }
  if (promo.end_at) {
    const end = new Date(promo.end_at).getTime();
    if (!Number.isNaN(end) && now > end) {
      return { ok: false, reason: "Mã đã hết hạn" };
    }
  }

  const minOrder = promo.min_order_amount ?? 0;
  if (servicePrice > 0 && servicePrice < minOrder) {
    return {
      ok: false,
      reason: `Đơn tối thiểu ${formatCurrency(minOrder)}`,
    };
  }

  const packages = promo.applicable_service_package_ids ?? [];
  if (packages.length > 0 && !packages.includes(servicePackageId)) {
    return { ok: false, reason: "Không áp dụng cho dịch vụ này" };
  }

  if (
    vehicleType &&
    promo.applicable_vehicle_types &&
    promo.applicable_vehicle_types.length > 0 &&
    !promo.applicable_vehicle_types.includes(vehicleType)
  ) {
    return { ok: false, reason: "Không áp dụng cho loại xe này" };
  }

  if (
    typeof promo.usage_limit === "number" &&
    typeof promo.usage_count === "number" &&
    promo.usage_limit > 0 &&
    promo.usage_count >= promo.usage_limit
  ) {
    return { ok: false, reason: "Mã đã hết lượt" };
  }

  return { ok: true };
}

export default function VoucherSection({
  promotions,
  servicePackageId,
  servicePrice,
  vehicleType,
  isAuthenticated,
  loading = false,
  applied,
  appliedVoucher,
  onAppliedChange,
  onVoucherChange,
  onError,
  onValidate,
  onValidateVoucher,
  validatingVoucher = false,
}: VoucherSectionProps) {
  const [code, setCode] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [customerEligibility, setCustomerEligibility] = useState<
    Record<string, { ok: boolean; reason?: string }>
  >({});
  const [probing, setProbing] = useState(false);
  const probeSeq = useRef(0);

  // Probe per-customer eligibility cho mỗi mã để biết customer này có dùng
  // được mã đó hay không. Chỉ probe các mã client-side OK để tiết kiệm
  // request. Lỗi mạng giữ nguyên trạng thái "không rõ" → không khóa mã.
  useEffect(() => {
    if (!isAuthenticated) {
      setCustomerEligibility({});
      return;
    }
    if (!onValidate || promotions.length === 0) return;

    const seq = ++probeSeq.current;
    const candidates = promotions.filter((promo) => {
      const check = isPromotionApplicable(
        promo,
        servicePackageId,
        servicePrice,
        vehicleType
      );
      return check.ok;
    });
    if (candidates.length === 0) return;

    setProbing(true);

    const run = async () => {
      const results: Record<string, { ok: boolean; reason?: string }> = {};
      await Promise.all(
        candidates.map(async (promo) => {
          try {
            const result = await onValidate(promo.code);
            if ("error" in result) {
              results[promo.id] = { ok: false, reason: result.error };
            } else {
              results[promo.id] = { ok: true };
            }
          } catch {
            // Bỏ qua lỗi mạng — coi như không rõ
          }
        })
      );
      if (seq === probeSeq.current) {
        setCustomerEligibility(results);
        setProbing(false);
      }
    };

    void run();

    return () => {
      // Invalidate stale probe khi servicePackageId/vehicleType/promotions đổi
    };
  }, [
    isAuthenticated,
    promotions,
    servicePackageId,
    servicePrice,
    vehicleType,
    onValidate,
  ]);

  const ranked = useMemo(() => {
    const tagged = promotions.map((promo) => {
      const clientCheck = isPromotionApplicable(
        promo,
        servicePackageId,
        servicePrice,
        vehicleType
      );
      const perCustomer = customerEligibility[promo.id];
      // Per-customer fail "thắng" — dùng lý do của nó
      if (perCustomer && !perCustomer.ok) {
        return {
          promo,
          check: {
            ok: false,
            reason: perCustomer.reason ?? "Không áp dụng được cho tài khoản này",
          },
        };
      }
      return { promo, check: clientCheck };
    });
    return tagged.sort((a, b) => {
      if (a.check.ok !== b.check.ok) return a.check.ok ? -1 : 1;
      return b.promo.discount_value - a.promo.discount_value;
    });
  }, [promotions, servicePackageId, servicePrice, vehicleType, customerEligibility]);

  const visible = expanded ? ranked : ranked.slice(0, 3);

  const handleApply = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      onError?.("Vui lòng nhập mã khuyến mãi.");
      return;
    }
    if (!isAuthenticated) {
      onError?.("Bạn cần đăng nhập để áp dụng mã.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await onValidate(trimmed);
      if ("error" in result) {
        onError?.(result.error);
        return;
      }
      onAppliedChange(result);
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    onAppliedChange(null);
    setCode("");
  };

  const handleApplyVoucher = async () => {
    const trimmed = voucherCode.trim();
    if (!trimmed) {
      onError?.("Vui lòng nhập mã voucher.");
      return;
    }
    if (!isAuthenticated) {
      onError?.("Bạn cần đăng nhập để áp dụng voucher.");
      return;
    }
    if (!onValidateVoucher) return;
    const result = await onValidateVoucher(trimmed);
    if ("error" in result) {
      onError?.(result.error);
      return;
    }
    onVoucherChange?.(result);
    setVoucherCode("");
  };

  const handleClearVoucher = () => {
    onVoucherChange?.(null);
    setVoucherCode("");
  };

  return (
    <View className="mx-4 mb-4">
      <Text className="text-xs font-bold text-muted-foreground tracking-wide mb-2">
        ƯU ĐÃI & KHUYẾN MÃI
      </Text>

      <View className="bg-card border border-border rounded-xl p-4 gap-3">
        {applied ? (
          <View className="rounded-xl bg-secondary border border-primary/40 px-3 py-3 flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-lg bg-primary items-center justify-center">
              <Check size={18} color="#ffffff" strokeWidth={3} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-primary">
                {applied.promotion.code}
              </Text>
              <Text className="text-xs text-primary/80" numberOfLines={1}>
                {applied.promotion.name}
              </Text>
              <Text className="text-xs text-primary mt-0.5">
                Tiết kiệm {formatCurrency(applied.discountAmount)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClear}
              disabled={submitting}
              className="w-9 h-9 rounded-lg bg-card border border-border items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Bỏ chọn mã khuyến mãi"
            >
              <X size={16} color="#1a56db" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <View className="flex-1 bg-input border border-border rounded-xl px-3 justify-center">
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Nhập mã khuyến mãi..."
                placeholderTextColor="#8a96a8"
                editable={!submitting}
                autoCapitalize="characters"
                autoCorrect={false}
                className="py-3 text-sm text-foreground"
                onSubmitEditing={() => void handleApply(code)}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity
              onPress={() => void handleApply(code)}
              disabled={submitting || !code.trim()}
              className={`rounded-xl px-4 justify-center ${
                submitting || !code.trim() ? "bg-muted" : "bg-primary"
              }`}
              accessibilityRole="button"
              accessibilityLabel="Áp dụng mã khuyến mãi"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-sm font-semibold">Áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-lg bg-secondary items-center justify-center">
            <Ticket size={14} color="#1a56db" strokeWidth={3} />
          </View>
          <Text className="text-xs font-semibold text-muted-foreground">
            {loading
              ? "Đang tải mã khả dụng..."
              : ranked.length > 0
                ? `${ranked.filter((r) => r.check.ok).length}/${ranked.length} mã phù hợp với dịch vụ này`
                : "Chưa có mã khuyến mãi nào"}
          </Text>
        </View>

        {!loading && ranked.length > 0 ? (
          <View className="gap-2">
            {visible.map(({ promo, check }) => {
              const isApplied = applied?.promotion.id === promo.id;
              const lockedByOther = Boolean(applied) && !isApplied;
              const disabled = !check.ok || submitting || lockedByOther;
              const perCustomerFail =
                customerEligibility[promo.id] &&
                !customerEligibility[promo.id].ok;
              return (
                <TouchableOpacity
                  key={promo.id}
                  onPress={() => {
                    if (disabled) return;
                    setCode(promo.code);
                    void handleApply(promo.code);
                  }}
                  disabled={disabled}
                  activeOpacity={disabled ? 1 : 0.8}
                  className={`rounded-xl px-3 py-3 flex-row items-center gap-3 border ${
                    isApplied
                      ? "border-2 border-primary bg-secondary"
                      : lockedByOther
                        ? "border-border bg-muted/40 opacity-50"
                        : !check.ok
                          ? "border-border bg-muted/40 opacity-60"
                          : "border-border bg-card"
                  }`}
                  accessibilityState={{ disabled }}
                  accessibilityLabel={
                    !check.ok
                      ? `Mã ${promo.code} không thể sử dụng: ${check.reason}`
                      : `Áp dụng mã ${promo.code}`
                  }
                >
                  <View
                    className={`w-10 h-10 rounded-lg items-center justify-center ${
                      isApplied ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    {isApplied ? (
                      <Check size={18} color="#ffffff" strokeWidth={3} />
                    ) : !check.ok ? (
                      <Lock size={16} color="#7a8599" strokeWidth={2.6} />
                    ) : (
                      <Ticket size={18} color="#1a5fd4" strokeWidth={2.4} />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`text-sm font-bold ${
                          isApplied ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {promo.code}
                      </Text>
                      <View className="rounded-full bg-secondary px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-primary">
                          {buildDiscountLabel(promo)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-xs text-foreground/80 mt-0.5"
                      numberOfLines={1}
                    >
                      {promo.name}
                    </Text>
                    <Text
                      className={`text-[11px] mt-0.5 ${
                        lockedByOther
                          ? "text-muted-foreground italic"
                          : check.ok
                            ? "text-muted-foreground"
                            : "text-danger"
                      }`}
                      numberOfLines={1}
                    >
                      {lockedByOther
                        ? "Bỏ chọn mã hiện tại để đổi"
                        : check.ok
                          ? formatExpiry(promo)
                          : check.reason}
                    </Text>
                  </View>
                  {perCustomerFail ? (
                    <View className="self-start rounded-md bg-muted px-1.5 py-0.5">
                      <Text className="text-[9px] font-bold text-muted-foreground tracking-wide">
                        KHÔNG DÙNG ĐƯỢC
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
            {ranked.length > 3 ? (
              <TouchableOpacity
                onPress={() => setExpanded((prev) => !prev)}
                className="self-center px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-primary">
                  {expanded
                    ? "Thu gọn"
                    : `Xem thêm ${ranked.length - 3} mã khác`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>

      {onValidateVoucher ? (
        <View className="bg-card border border-border rounded-xl p-4 gap-3 mt-3">
          <View className="flex-row items-center gap-2">
            <TicketPercent size={16} color="#1a56db" strokeWidth={2.4} />
            <Text className="text-xs font-bold text-muted-foreground tracking-wide">
              VOUCHER CỦA TÔI
            </Text>
          </View>
          {appliedVoucher ? (
            <View className="rounded-xl bg-secondary border border-primary/40 px-3 py-3 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-primary items-center justify-center">
                <Check size={18} color="#ffffff" strokeWidth={3} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-primary">
                  {appliedVoucher.code}
                </Text>
                <Text className="text-xs text-primary/80">
                  Voucher đã áp dụng
                </Text>
                {appliedVoucher.discountAmount > 0 ? (
                  <Text className="text-xs text-primary mt-0.5">
                    Tiết kiệm {formatCurrency(appliedVoucher.discountAmount)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleClearVoucher}
                disabled={validatingVoucher}
                className="w-9 h-9 rounded-lg bg-card border border-border items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Bỏ chọn voucher"
              >
                <X size={16} color="#1a56db" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <View className="flex-1 bg-input border border-border rounded-xl px-3 justify-center">
                <TextInput
                  value={voucherCode}
                  onChangeText={setVoucherCode}
                  placeholder="Nhập mã voucher (vd: CARE_ABC123)..."
                  placeholderTextColor="#8a96a8"
                  editable={!validatingVoucher}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className="py-3 text-sm text-foreground"
                  onSubmitEditing={handleApplyVoucher}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity
                onPress={handleApplyVoucher}
                disabled={validatingVoucher || !voucherCode.trim()}
                className={`rounded-xl px-4 justify-center ${
                  validatingVoucher || !voucherCode.trim()
                    ? "bg-muted"
                    : "bg-primary"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Áp dụng voucher"
              >
                {validatingVoucher ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-sm font-semibold">
                    Áp dụng
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          <Text className="text-[11px] text-muted-foreground leading-4">
            Voucher là mã riêng do hệ thống tặng (thường bắt đầu bằng{" "}
            <Text className="font-semibold">CARE_</Text>), khác với mã khuyến
            mãi ở trên.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
