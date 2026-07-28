import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import BookingInfoCard from "@/components/payment/BookingInfoCard";
import LoadingButton from "@/components/common/LoadingButton";
import PaymentMethodList from "@/components/payment/PaymentMethodList";
import PriceSummary from "@/components/payment/PriceSummary";
import VoucherSection, {
  type AppliedPromotion,
  type AppliedVoucher,
} from "@/components/payment/VoucherSection";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import type { QueryValue } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Promotion, Vehicle, VehicleType } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const AVATAR =
  "https://storage.googleapis.com/banani-avatars/avatar/male/25-35/East Asian/0";

type SelectedPayment = "payos" | "cash";

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
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment>(
    "payos"
  );
  const [usedPoints, setUsedPoints] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromotion | null>(
    null
  );
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(
    null
  );
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [pointMultiplier, setPointMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const basePrice = Number(params.price ?? 0);
  const total = Math.max(
    0,
    basePrice - promoDiscount - voucherDiscount - pointsDiscount
  );
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
    setPromoDiscount(0);
    setVoucherDiscount(0);
    setPointsDiscount(0);
    setAppliedPoints(0);
    setUsedPoints("0");
    setAppliedPromo(null);
    setAppliedVoucher(null);
  }, [params.quoteId, params.servicePackageId]);

  const handleAppliedChange = useCallback(
    (next: AppliedPromotion | null) => {
      setAppliedPromo(next);
      setPromoDiscount(next?.discountAmount ?? 0);
      setPointsDiscount(0);
      setAppliedPoints(0);
      setUsedPoints("0");
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
      setVoucherDiscount(next?.discountAmount ?? 0);
      setPointsDiscount(0);
      setAppliedPoints(0);
      setUsedPoints("0");
    },
    []
  );

  const priceRows = useMemo(
    () => [
      { label: "Tạm tính", value: formatCurrency(basePrice) },
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
      basePrice,
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
    if (!Number.isFinite(points) || points < 0) {
      Alert.alert("Điểm không hợp lệ", "Vui lòng nhập số điểm hợp lệ.");
      return;
    }

    try {
      const response = await api.redeemPreview(accessToken, {
        service_package_id: params.servicePackageId,
        quote_id: params.quoteId,
        promotion_code: appliedPromo?.promotion.code,
        voucher_code: appliedVoucher?.code,
        used_points: points,
      });
      const finalPrice = response.data.final_price ?? basePrice;
      const discountFromBe =
        basePrice - promoDiscount - voucherDiscount - finalPrice;
      setPointsDiscount(Math.max(0, discountFromBe));
      setAppliedPoints(points);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể áp điểm.";
      Alert.alert("Không thể áp điểm", message);
      setPointsDiscount(0);
      setAppliedPoints(0);
    }
  };

  const openCheckout = useCallback(
    async (checkoutUrl: string | null | undefined, bookingId: string) => {
      if (!checkoutUrl) {
        Alert.alert(
          "Không có liên kết thanh toán",
          "Vui lòng thử lại hoặc chọn thanh toán tiền mặt tại garage."
        );
        return;
      }
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (!supported) {
        Alert.alert(
          "Không thể mở liên kết",
          "Thiết bị không hỗ trợ mở liên kết thanh toán. Vui lòng thử lại."
        );
        return;
      }
      await Linking.openURL(checkoutUrl);
      router.replace({
        pathname: "/payment-success",
        params: {
          bookingId,
          garageName: params.garageName,
          serviceName: params.serviceName,
          startTime: params.startTime,
          vehiclePlate: params.vehiclePlate,
          total: String(total),
          paymentMethod: "PAYOS",
          pending: "1",
        },
      });
    },
    [
      params.garageName,
      params.serviceName,
      params.startTime,
      params.vehiclePlate,
      router,
      total,
    ]
  );

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

    setSubmitting(true);
    try {
      const addOnIdsRaw = params.addOnIds ?? "";
      const addOnServiceIds = addOnIdsRaw
        ? addOnIdsRaw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      const noteText =
        selectedPayment === "payos"
          ? "Customer chọn thanh toán PayOS online."
          : "Customer chọn thanh toán tiền mặt tại garage.";

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
        note: noteText,
      });

      const bookingId = response.data.id;

      if (selectedPayment === "payos") {
        try {
          const paymentResponse = await api.createPayosPayment(
            accessToken,
            bookingId
          );
          const checkoutUrl = paymentResponse.data?.payment?.checkout_url;
          await openCheckout(checkoutUrl, bookingId);
          return;
        } catch (payosError) {
          const payosMessage =
            payosError instanceof ApiError
              ? payosError.message
              : "Không thể khởi tạo thanh toán PayOS.";
          Alert.alert(
            "Booking đã tạo nhưng PayOS lỗi",
            `${payosMessage}\n\nBạn có thể thanh toán sau từ chi tiết lịch hẹn.`,
            [
              { text: "Ở lại", style: "cancel" },
              {
                text: "Xem chi tiết",
                onPress: () =>
                  router.replace({
                    pathname: "/booking-detail",
                    params: { id: bookingId },
                  }),
              },
            ]
          );
          return;
        }
      }

      router.replace({
        pathname: "/payment-success",
        params: {
          bookingId,
          garageName: params.garageName,
          serviceName: params.serviceName,
          startTime: params.startTime,
          vehiclePlate: params.vehiclePlate,
          total: String(response.data.final_price ?? total),
          paymentMethod: "CASH",
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
            price: formatCurrency(basePrice),
            plate: params.vehiclePlate ?? "Chưa rõ biển số",
            time: formatDateTime(params.startTime),
            location: params.garageName ?? "Garage đã chọn",
          }}
        />

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
                  setPointsDiscount(0);
                  setAppliedPoints(0);
                }}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-xl border border-border bg-input px-3 py-3 text-foreground"
              />
              <TouchableOpacity
                onPress={handleApplyPoints}
                className="rounded-xl bg-dark px-4 justify-center"
              >
                <Text className="text-white font-semibold">Áp điểm</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <PaymentMethodList
          selectedId={selectedPayment}
          onSelect={(id) => setSelectedPayment(id as SelectedPayment)}
        />

        <PriceSummary rows={priceRows} total={formatCurrency(total)} />

        {selectedPayment === "payos" ? (
          <View className="mx-4 mb-4 rounded-xl bg-secondary px-4 py-3 flex-row gap-3">
            <ExternalLink size={18} color="#1a5fd4" strokeWidth={2.4} />
            <View className="flex-1">
              <Text className="text-xs text-foreground leading-5">
                Sau khi xác nhận, hệ thống sẽ mở trang thanh toán PayOS. Bạn
                có thể quét QR ngân hàng hoặc dùng thẻ Visa/Master/JCB. Trạng
                thái booking sẽ tự động cập nhật khi thanh toán thành công.
              </Text>
            </View>
          </View>
        ) : null}

        <View className="px-4 pb-4">
          <LoadingButton
            title={
              selectedPayment === "payos"
                ? "Xác nhận và thanh toán PayOS"
                : "Xác nhận đặt lịch"
            }
            disabled={loading}
            onPress={handleConfirmBooking}
            loading={submitting}
            loadingTitle={
              selectedPayment === "payos"
                ? "Đang mở PayOS..."
                : "Đang tạo lịch hẹn..."
            }
            icon={ArrowRight}
            iconPosition="right"
            variant="primary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
