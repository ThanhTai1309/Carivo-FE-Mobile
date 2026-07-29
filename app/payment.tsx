import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ShieldAlert,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import BookingInfoCard from "@/components/payment/BookingInfoCard";
import LoadingButton from "@/components/common/LoadingButton";
import PriceSummary from "@/components/payment/PriceSummary";
import VoucherSection, {
  type AppliedPromotion,
  type AppliedVoucher,
} from "@/components/payment/VoucherSection";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import type { QueryValue } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  BookingViolationStatus,
  Promotion,
  Vehicle,
  VehicleType,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const AVATAR =
  "https://storage.googleapis.com/banani-avatars/avatar/male/25-35/East Asian/0";

interface PricingPreview {
  original_price?: number;
  promotion_discount_amount?: number;
  used_points?: number;
  points_discount_amount?: number;
  discount_amount?: number;
  final_price?: number;
}

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    garageId?: string;
    garageName?: string;
    servicePackageId?: string;
    serviceName?: string;
    vehicleId?: string;
    vehicleName?: string;
    vehiclePlate?: string;
    startTime?: string;
    price?: string;
    quoteId?: string;
    addOnIds?: string;
  }>();
  const { accessToken, isAuthenticated } = useApp();
  const [usedPoints, setUsedPoints] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromotion | null>(
    null
  );
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null
  );
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [violationStatus, setViolationStatus] =
    useState<BookingViolationStatus | null>(null);
  const [pointMultiplier, setPointMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(
    null
  );
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const pricingRequestRef = useRef(0);

  const rawBasePrice = Number(params.price ?? 0);
  const basePrice =
    Number.isFinite(rawBasePrice) && rawBasePrice > 0 ? rawBasePrice : 0;
  const promoDiscount =
    pricingPreview?.promotion_discount_amount ??
    appliedPromo?.discountAmount ??
    0;
  const pointsDiscount = pricingPreview?.points_discount_amount ?? 0;
  const previewDiscount = pricingPreview?.discount_amount;
  const displayBasePrice = pricingPreview?.original_price ?? basePrice;
  const voucherDiscount =
    previewDiscount !== undefined
      ? Math.max(0, previewDiscount - promoDiscount - pointsDiscount)
      : appliedVoucher?.discountAmount ?? 0;
  const total =
    pricingPreview?.final_price ??
    Math.max(
      0,
      displayBasePrice - promoDiscount - voucherDiscount - pointsDiscount
    );
  const enteredPoints = Number(usedPoints || 0);
  const hasUnappliedPoints =
    Number.isInteger(enteredPoints) &&
    enteredPoints > 0 &&
    enteredPoints !== appliedPoints;
  const hasBenefits = Boolean(appliedPromo || appliedVoucher || appliedPoints);
  const pricingBlocked =
    hasUnappliedPoints ||
    (hasBenefits &&
      (pricingLoading || !pricingPreview || Boolean(pricingError)));
  const estimatedEarnedPoints = Math.max(
    0,
    Math.round((total / 1000) * pointMultiplier)
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const query: Record<string, QueryValue> = {
          limit: 50,
        };
        const promotionsResponse = await api.getPromotions(query);
        setPromotions(promotionsResponse.data ?? []);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải khuyến mãi.";
        Alert.alert("Lỗi dữ liệu", message);
      }

      if (isAuthenticated && accessToken) {
        try {
          const loyaltyResponse = await api.getLoyaltySummary(accessToken);
          setCurrentPoints(
            loyaltyResponse.data.loyalty?.available_points ?? 0
          );
          const multiplier = loyaltyResponse.data.current_tier_rule?.point_multiplier;
          if (typeof multiplier === "number" && multiplier > 0) {
            setPointMultiplier(multiplier);
          }
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Không thể tải điểm thưởng.";
          Alert.alert("Lỗi dữ liệu", message);
        }

        try {
          const violationResponse =
            await api.getBookingViolationStatus(accessToken);
          setViolationStatus(violationResponse.data);
        } catch {
          setViolationStatus(null);
        }
      }

      setLoading(false);
    };

    void loadData();
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!accessToken || !params.vehicleId) {
        setVehicle(null);
        return;
      }
      try {
        const response = await api.getVehicle(accessToken, params.vehicleId);
        setVehicle(response.data ?? null);
      } catch {
        setVehicle(null);
      }
    };
    void loadVehicle();
  }, [accessToken, params.vehicleId]);

  useEffect(() => {
    setAppliedPoints(0);
    setUsedPoints("0");
    setAppliedPromo(null);
    setAppliedVoucher(null);
    setPricingPreview(null);
    setPricingError(null);
  }, [params.quoteId, params.servicePackageId]);

  const handleAppliedChange = useCallback(
    (next: AppliedPromotion | null) => {
      setAppliedPromo(next);
      setAppliedPoints(0);
      setUsedPoints("0");
      setPricingPreview(null);
      setPricingError(null);
    },
    []
  );

  const handleValidatePromo = useCallback(
    async (
      promotionCode: string
    ): Promise<AppliedPromotion | { error: string }> => {
      if (!accessToken || !params.servicePackageId) {
        return { error: "Thiếu thông tin để áp dụng mã." };
      }
      try {
        const response = await api.validatePromotion(
          accessToken,
          promotionCode,
          params.servicePackageId,
          params.quoteId
        );
        const promo = response.data.promotion;
        const discount = response.data.discount_amount ?? 0;
        if (!promo) {
          return { error: "Mã không hợp lệ." };
        }
        return {
          promotion: promo,
          discountAmount: discount,
          finalPrice: response.data.final_price ?? basePrice,
        };
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Mã không hợp lệ hoặc đã hết hạn.";
        return { error: message };
      }
    },
    [accessToken, params.servicePackageId, params.quoteId, basePrice]
  );

  const handleValidateVoucher = useCallback(
    async (
      voucherCode: string
    ): Promise<AppliedVoucher | { error: string }> => {
      const trimmed = voucherCode.trim();
      if (!trimmed) {
        return { error: "Vui lòng nhập mã voucher." };
      }
      if (!accessToken) {
        return { error: "Bạn cần đăng nhập để áp dụng voucher." };
      }
      if (!params.servicePackageId) {
        return { error: "Thiếu thông tin dịch vụ để áp voucher." };
      }
      try {
        const response = await api.validateVoucher(
          accessToken,
          trimmed.toUpperCase(),
          params.servicePackageId,
          params.quoteId
        );
        const voucher = response.data?.voucher;
        const discount = response.data?.discount_amount ?? 0;
        if (!voucher) {
          return { error: "Voucher không hợp lệ hoặc đã được sử dụng." };
        }
        return {
          code: voucher.code,
          discountAmount: discount,
          voucherId: voucher.id,
          expiresAt: voucher.expires_at ?? null,
        };
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Mã voucher không hợp lệ hoặc đã hết hạn.";
        return { error: message };
      }
    },
    [accessToken, params.servicePackageId, params.quoteId]
  );

  const handleVoucherChange = useCallback(
    (next: AppliedVoucher | null) => {
      setAppliedVoucher(next);
      setAppliedPoints(0);
      setUsedPoints("0");
      setPricingPreview(null);
      setPricingError(null);
    },
    []
  );

  const loadPricingPreview = useCallback(
    async (points: number, showError: boolean) => {
      if (!accessToken || !params.servicePackageId || !params.quoteId) {
        return null;
      }

      const requestId = ++pricingRequestRef.current;
      setPricingLoading(true);
      setPricingError(null);

      try {
        const response = await api.redeemPreview(accessToken, {
          service_package_id: params.servicePackageId,
          quote_id: params.quoteId,
          promotion_code: appliedPromo?.promotion.code,
          voucher_code: appliedVoucher?.code,
          used_points: points,
        });

        if (requestId !== pricingRequestRef.current) {
          return null;
        }

        setPricingPreview(response.data);
        return response.data;
      } catch (error) {
        if (requestId !== pricingRequestRef.current) {
          return null;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể xác nhận tổng tiền từ hệ thống.";
        setPricingPreview(null);
        setPricingError(message);

        if (showError) {
          Alert.alert("Không thể áp dụng ưu đãi", message);
        }

        return null;
      } finally {
        if (requestId === pricingRequestRef.current) {
          setPricingLoading(false);
        }
      }
    },
    [
      accessToken,
      appliedPromo?.promotion.code,
      appliedVoucher?.code,
      params.quoteId,
      params.servicePackageId,
    ]
  );

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !params.quoteId) {
      return;
    }

    void loadPricingPreview(appliedPoints, false);
  }, [
    accessToken,
    appliedPoints,
    appliedPromo?.promotion.code,
    appliedVoucher?.code,
    isAuthenticated,
    loadPricingPreview,
    params.quoteId,
  ]);

  const priceRows = useMemo(
    () => [
      { label: "Tạm tính", value: formatCurrency(displayBasePrice) },
      {
        label: appliedPromo
          ? `Khuyến mãi (${appliedPromo.promotion.code})`
          : "Khuyến mãi",
        value: promoDiscount
          ? `- ${formatCurrency(promoDiscount)}`
          : formatCurrency(0),
        danger: promoDiscount > 0,
      },
      {
        label: appliedVoucher
          ? `Voucher (${appliedVoucher.code})`
          : "Voucher",
        value: voucherDiscount
          ? `- ${formatCurrency(voucherDiscount)}`
          : formatCurrency(0),
        danger: voucherDiscount > 0,
      },
      {
        label: "Điểm thưởng",
        value: pointsDiscount
          ? `- ${formatCurrency(pointsDiscount)}`
          : formatCurrency(0),
        danger: pointsDiscount > 0,
      },
      {
        label: `Điểm dự kiến tích lũy (x${pointMultiplier.toFixed(1)})`,
        value: `+${estimatedEarnedPoints} điểm`,
        success: true,
      },
    ],
    [
      displayBasePrice,
      estimatedEarnedPoints,
      pointMultiplier,
      pointsDiscount,
      promoDiscount,
      voucherDiscount,
      appliedPromo,
      appliedVoucher,
    ]
  );

  const handleApplyPoints = async () => {
    if (!accessToken || !params.servicePackageId) {
      return;
    }

    const points = Number(usedPoints || 0);
    if (!Number.isInteger(points) || points < 0) {
      Alert.alert("Điểm không hợp lệ", "Vui lòng nhập số điểm hợp lệ.");
      return;
    }

    const preview = await loadPricingPreview(points, true);
    if (preview) {
      setAppliedPoints(preview.used_points ?? points);
      return;
    }

    setAppliedPoints(0);
    if (points > 0) {
      void loadPricingPreview(0, false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated || !accessToken) {
      router.push("/login");
      return;
    }

    if (
      !params.garageId ||
      !params.servicePackageId ||
      !params.vehicleId ||
      !params.startTime ||
      !params.quoteId
    ) {
      Alert.alert("Thiếu dữ liệu", "Thiếu thông tin booking để xác nhận.");
      return;
    }

    if (violationStatus?.booking_blocked) {
      Alert.alert(
        "Tạm khóa đặt lịch",
        violationStatus.booking_blocked_until
          ? `Bạn chưa thể tạo booking mới đến ${formatDateTime(
              violationStatus.booking_blocked_until
            )}.`
          : "Tài khoản đang bị tạm khóa tạo booking mới.",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Xem chi tiết",
            onPress: () => router.push("/booking-reliability"),
          },
        ]
      );
      return;
    }

    if (pricingBlocked) {
      if (hasUnappliedPoints) {
        Alert.alert(
          "Điểm chưa được áp dụng",
          "Vui lòng bấm Áp điểm hoặc nhập 0 trước khi xác nhận booking."
        );
        return;
      }

      Alert.alert(
        "Chưa xác nhận được tổng tiền",
        pricingError ??
          "Vui lòng chờ hệ thống xác nhận khuyến mãi, voucher và điểm thưởng."
      );
      return;
    }

    setSubmitting(true);
    try {
      const addOnIdsRaw = params.addOnIds ?? "";
      const addOnServiceIds = addOnIdsRaw
        ? addOnIdsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      const response = await api.createBooking(accessToken, {
        garage_id: params.garageId,
        vehicle_id: params.vehicleId,
        service_package_id: params.servicePackageId,
        add_on_service_ids: addOnServiceIds,
        quote_id: params.quoteId,
        start_time: params.startTime,
        promotion_code: appliedPromo?.promotion.code,
        voucher_code: appliedVoucher?.code,
        used_points: appliedPoints || undefined,
      });

      const bookingId = response.data.id;

      router.replace({
        pathname: "/payment-success",
        params: {
          bookingId,
          garageName: params.garageName,
          serviceName: params.serviceName,
          startTime: params.startTime,
          vehiclePlate: params.vehiclePlate,
          total: String(response.data.final_price ?? total),
          paymentMethod: "UNPAID",
        },
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể tạo booking.";
      Alert.alert("Tạo booking thất bại", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/booking");
  };

  const vehicleType: VehicleType | undefined = vehicle?.vehicle_type;

  if (
    !params.servicePackageId ||
    !params.garageId ||
    !params.startTime ||
    !params.quoteId
  ) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Thiếu dữ liệu đặt lịch"
          description="Quay lại màn booking để chọn garage, dịch vụ và khung giờ."
          actionLabel="Quay lại booking"
          onAction={() => router.replace("/(tabs)/booking")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 pt-5 pb-3 bg-background">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={handleBack}>
            <ArrowLeft size={22} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-primary">Xác nhận booking</Text>
        </View>
        <Image
          source={{ uri: AVATAR }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <BookingInfoCard
          info={{
            serviceName: params.serviceName ?? "Dịch vụ đã chọn",
            price: formatCurrency(displayBasePrice),
            plate: params.vehiclePlate ?? "Chưa rõ biển số",
            time: formatDateTime(params.startTime),
            location: params.garageName ?? "Garage đã chọn",
          }}
        />

        {violationStatus && violationStatus.risk_status !== "NORMAL" ? (
          <TouchableOpacity
            onPress={() => router.push("/booking-reliability")}
            className={`mx-4 mb-4 flex-row gap-3 rounded-xl border px-4 py-3 ${
              violationStatus.booking_blocked
                ? "border-red-200 bg-red-50"
                : violationStatus.deposit_required
                  ? "border-blue-200 bg-blue-50"
                  : "border-amber-200 bg-amber-50"
            }`}
          >
            <ShieldAlert
              size={18}
              color={
                violationStatus.booking_blocked
                  ? "#b91c1c"
                  : violationStatus.deposit_required
                    ? "#1d4ed8"
                    : "#b45309"
              }
              strokeWidth={2.3}
            />
            <View className="flex-1">
              <Text
                className={`text-sm font-bold ${
                  violationStatus.booking_blocked
                    ? "text-red-800"
                    : violationStatus.deposit_required
                      ? "text-blue-800"
                      : "text-amber-800"
                }`}
              >
                {violationStatus.booking_blocked
                  ? "Tài khoản đang tạm khóa đặt lịch"
                  : violationStatus.deposit_required
                    ? "Booking thuộc diện cảnh báo đặt cọc"
                    : "Tài khoản đang ở mức cảnh báo"}
              </Text>
              <Text
                className={`mt-1 text-xs ${
                  violationStatus.booking_blocked
                    ? "text-red-700"
                    : violationStatus.deposit_required
                      ? "text-blue-700"
                      : "text-amber-700"
                }`}
              >
                Bạn đang có {violationStatus.violation_score} điểm vi phạm. Nhấn
                để xem chi tiết.
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <VoucherSection
          promotions={promotions}
          servicePackageId={params.servicePackageId}
          servicePrice={basePrice}
          vehicleType={vehicleType}
          isAuthenticated={isAuthenticated}
          loading={loading}
          applied={appliedPromo}
          appliedVoucher={appliedVoucher}
          onAppliedChange={handleAppliedChange}
          onVoucherChange={handleVoucherChange}
          onError={(msg) => Alert.alert("Mã khuyến mãi", msg)}
          onValidate={handleValidatePromo}
          onValidateVoucher={handleValidateVoucher}
        />

        {isAuthenticated ? (
          <View className="mx-4 mb-4 rounded-xl border border-border bg-card p-4 gap-3">
            <Text className="text-xs font-bold text-muted-foreground tracking-wide">
              ĐIỂM TÍCH LŨY
            </Text>
            <Text className="text-sm text-foreground">
              Bạn hiện có {currentPoints} điểm.
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                value={usedPoints}
                onChangeText={(value) => {
                  setUsedPoints(value);
                  setAppliedPoints(0);
                  setPricingPreview(null);
                  setPricingError(null);
                }}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-xl border border-border bg-input px-3 py-3 text-foreground"
              />
              <TouchableOpacity
                onPress={handleApplyPoints}
                disabled={pricingLoading}
                className={`rounded-xl px-4 justify-center ${
                  pricingLoading ? "bg-muted" : "bg-dark"
                }`}
              >
                {pricingLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold">Áp điểm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <PriceSummary rows={priceRows} total={formatCurrency(total)} />

        {pricingError && hasBenefits ? (
          <View className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <Text className="text-xs font-semibold text-red-700">
              {pricingError}
            </Text>
          </View>
        ) : null}

        <View className="mx-4 mb-4 rounded-xl bg-secondary px-4 py-3 flex-row gap-3">
          <Clock3 size={18} color="#1a5fd4" strokeWidth={2.4} />
          <View className="flex-1">
            <Text className="text-xs text-foreground leading-5">
              Bạn chưa cần thanh toán khi đặt lịch. Sau khi garage hoàn tất
              dịch vụ và bạn xác nhận bàn giao xe, bạn có thể chọn PayOS hoặc
              thanh toán tiền mặt tại garage.
            </Text>
          </View>
        </View>

        <View className="px-4 pb-4">
          <LoadingButton
            title="Xác nhận đặt lịch"
            disabled={
              loading || pricingBlocked || Boolean(violationStatus?.booking_blocked)
            }
            onPress={handleConfirmBooking}
            loading={submitting}
            loadingTitle="Đang tạo lịch hẹn..."
            icon={ArrowRight}
            iconPosition="right"
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
