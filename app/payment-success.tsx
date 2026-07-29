import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  CarFront,
  Check,
  ChevronRight,
  CircleHelp,
  Clock4,
  CreditCard,
  Hourglass,
  House,
  LifeBuoy,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDateTimeLong } from "@/lib/format";
import type { Booking, PaymentTransaction } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function shortBookingId(id?: string | null): string {
  if (!id) return "—";
  const cleaned = id.replace(/-/g, "");
  if (cleaned.length <= 6) return id.toUpperCase();
  return `${cleaned.slice(0, 4).toUpperCase()}${cleaned
    .slice(-4)
    .toUpperCase()}`;
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
      <View className="w-11 h-11 rounded-xl bg-muted items-center justify-center flex-shrink-0">
        <Icon size={20} color="#1a1a1a" strokeWidth={1.9} />
      </View>
      <View className="flex-1 pt-0.5">
        <Text className="text-xs text-muted-foreground mb-0.5">{label}</Text>
        <Text
          className="text-sm font-semibold text-foreground leading-snug"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function PaymentBadge({ label }: { label: string }) {
  const isPayos = label === "PAYOS";
  const isCash = label === "CASH";
  const Icon = isPayos ? CreditCard : isCash ? Wallet : Clock4;
  const text = isPayos
    ? "PayOS Online"
    : isCash
      ? "Tiền mặt tại garage"
      : "Thanh toán sau dịch vụ";
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={18} color="#1a1f2e" strokeWidth={2} />
      <Text className="text-xs font-bold text-foreground tracking-wider">
        {text}
      </Text>
    </View>
  );
}

type PaymentState = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELED";

function getBookingPaymentLabel(status?: string): string {
  switch (status) {
    case "PAID":
      return "Đã thanh toán";
    case "PENDING":
      return "Đang chờ thanh toán";
    case "WAIVED":
      return "Được miễn thanh toán";
    default:
      return "Chưa thanh toán";
  }
}

function pickState(payment: PaymentTransaction | null): PaymentState {
  if (!payment) return "PENDING";
  switch (payment.status) {
    case "PAID":
      return "PAID";
    case "FAILED":
      return "FAILED";
    case "EXPIRED":
      return "EXPIRED";
    case "CANCELED":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    garageName?: string;
    serviceName?: string;
    startTime?: string;
    total?: string;
    vehiclePlate?: string;
    paymentMethod?: string;
    pending?: string;
  }>();
  const { accessToken, isAuthenticated } = useApp();

  const isPayosFlow = params.paymentMethod === "PAYOS";
  const isPendingPayos = isPayosFlow && params.pending === "1";

  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [pollState, setPollState] = useState<PaymentState>(
    isPendingPayos ? "PENDING" : "PAID"
  );
  const [refreshing, setRefreshing] = useState(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);
  const pollErrorCountRef = useRef(0);

  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const playEntranceAnimation = useCallback(() => {
    ringScale.setValue(0.7);
    ringOpacity.setValue(0);
    checkScale.setValue(0);
    fadeIn.setValue(0);
    slideUp.setValue(20);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [checkScale, fadeIn, ringOpacity, ringScale, slideUp]);

  useEffect(() => {
    playEntranceAnimation();
  }, [pollState, playEntranceAnimation]);

  const stopPolling = useCallback(() => {
    stoppedRef.current = true;
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const pollPayment = useCallback(async () => {
    if (!accessToken || !params.bookingId || stoppedRef.current) return;
    try {
      const [paymentResponse, bookingResponse] = await Promise.all([
        api.getPayosPayment(accessToken, params.bookingId),
        api.getBooking(accessToken, params.bookingId).catch(() => null),
      ]);
      if (stoppedRef.current) return;

      const next = paymentResponse.data?.payment ?? null;
      setPayment(next);
      pollErrorCountRef.current = 0;
      if (bookingResponse) {
        setBooking(bookingResponse.data);
      }
      const state = pickState(next);
      setPollState(state);

      if (
        state === "PENDING" &&
        paymentResponse.data?.poll_after_ms &&
        !stoppedRef.current
      ) {
        const delay = Math.max(
          1500,
          Math.min(paymentResponse.data.poll_after_ms, 10000)
        );
        pollTimeoutRef.current = setTimeout(() => {
          void pollPayment();
        }, delay);
      } else {
        stopPolling();
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        stopPolling();
        return;
      }

      if (error instanceof ApiError && error.status === 404) {
        setPollState("FAILED");
        stopPolling();
        return;
      }

      pollErrorCountRef.current += 1;
      const delay = Math.min(
        10000,
        1500 * 2 ** Math.min(pollErrorCountRef.current, 3)
      );
      pollTimeoutRef.current = setTimeout(() => {
        void pollPayment();
      }, delay);
    }
  }, [accessToken, params.bookingId, stopPolling]);

  useEffect(() => {
    if (!isPendingPayos || !isAuthenticated || !accessToken || !params.bookingId) {
      return;
    }
    stoppedRef.current = false;
    void pollPayment();
    return () => {
      stopPolling();
    };
  }, [isPendingPayos, isAuthenticated, accessToken, params.bookingId, pollPayment, stopPolling]);

  useEffect(() => {
    if (
      isPayosFlow ||
      !isAuthenticated ||
      !accessToken ||
      !params.bookingId
    ) {
      return;
    }

    void api
      .getBooking(accessToken, params.bookingId)
      .then((response) => setBooking(response.data))
      .catch(() => null);
  }, [
    accessToken,
    isAuthenticated,
    isPayosFlow,
    params.bookingId,
  ]);

  const onRefresh = useCallback(async () => {
    if (!accessToken || !params.bookingId) return;
    setRefreshing(true);
    try {
      stoppedRef.current = false;
      pollErrorCountRef.current = 0;
      await pollPayment();
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, params.bookingId, pollPayment]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const bookingIdDisplay = shortBookingId(params.bookingId);
  const startTime = booking?.start_time ?? params.startTime;
  const garageName = booking?.garage?.name ?? params.garageName;
  const serviceName = booking?.service_package?.name ?? params.serviceName;
  const vehiclePlate =
    booking?.vehicle?.raw_license_plate ?? params.vehiclePlate;
  const formattedStartTime = startTime
    ? formatDateTimeLong(startTime)
    : "Chưa có thời gian";
  const totalAmount = formatCurrency(
    payment?.amount ?? booking?.final_price ?? Number(params.total ?? 0)
  );

  const isPaid = pollState === "PAID";
  const isPending = pollState === "PENDING";
  const isFailed =
    pollState === "FAILED" || pollState === "EXPIRED" || pollState === "CANCELED";

  const isBookingFlow = !isPayosFlow;
  const heroTitle = isBookingFlow
    ? "Đặt lịch thành công!"
    : isPaid
      ? "Thanh toán thành công!"
      : isPending
        ? "Đang chờ thanh toán..."
        : "Thanh toán chưa hoàn tất";
  const heroDescription = isBookingFlow
    ? "Lịch hẹn đã được tạo. Bạn sẽ chọn PayOS hoặc tiền mặt sau khi dịch vụ hoàn tất và xác nhận bàn giao xe."
    : isPaid
      ? "Cảm ơn bạn đã thanh toán. Chúng tôi sẽ xử lý lịch hẹn của bạn ngay."
      : isPending
        ? "Hệ thống đang chờ PayOS xác nhận. Bạn có thể đóng app và quay lại sau, hoặc kéo xuống để làm mới."
        : "Thanh toán chưa hoàn tất. Vui lòng thử lại hoặc chọn phương thức khác.";

  const handleShare = async () => {
    if (!params.bookingId) return;
    try {
      await Share.share({
        message: `Đặt lịch Carivo thành công!\nMã: ${bookingIdDisplay}\nDịch vụ: ${
          serviceName ?? "—"
        }\nThời gian: ${formattedStartTime}\nĐịa điểm: ${
          garageName ?? "—"
        }\nTổng: ${totalAmount}`,
        title: "Đặt lịch Carivo",
      });
    } catch {
      // ignore
    }
  };

  const handleOpenDetail = () => {
    if (!params.bookingId) return;
    router.push({
      pathname: "/booking-detail",
      params: { id: params.bookingId },
    });
  };

  const handleBackHome = () => router.push("/(tabs)");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          isPendingPayos ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        <View
          style={[
            styles.heroBg,
            isFailed && { backgroundColor: "#fee2e2" },
          ]}
          className="relative items-center pt-14 pb-10 px-6"
        >
          <View
            style={[
              styles.dot,
              { top: 40, left: 32, width: 8, height: 8, opacity: 0.35 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 72, right: 48, width: 6, height: 6, opacity: 0.28 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 120, right: 28, width: 10, height: 10, opacity: 0.25 },
            ]}
          />

          <View style={styles.checkStack}>
            {isPaid ? (
              <>
                <Animated.View
                  style={[
                    styles.ringOuter,
                    {
                      opacity: ringOpacity,
                      transform: [{ scale: ringScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.ringMiddle,
                    {
                      opacity: ringOpacity,
                      transform: [
                        {
                          scale: ringScale.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0.85, 0.95],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.ringInner,
                    { transform: [{ scale: checkScale }] },
                  ]}
                >
                  <Check size={52} color="#1a5fd4" strokeWidth={3.2} />
                </Animated.View>
              </>
            ) : isPending ? (
              <>
                <Animated.View
                  style={[
                    styles.ringOuter,
                    {
                      opacity: ringOpacity,
                      transform: [{ scale: ringScale }],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.ringMiddle,
                    {
                      opacity: ringOpacity,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ringInner,
                    { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
                  ]}
                >
                  <ActivityIndicator size="large" color="#ea580c" />
                </View>
              </>
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.ringOuter,
                    {
                      opacity: ringOpacity,
                      transform: [{ scale: ringScale }],
                      borderColor: "rgba(185,28,28,0.25)",
                      backgroundColor: "rgba(185,28,28,0.04)",
                    },
                  ]}
                />
                <View
                  style={[
                    styles.ringInner,
                    { backgroundColor: "#ffffff", borderColor: "#fecaca" },
                  ]}
                >
                  <X size={52} color="#b91c1c" strokeWidth={3.2} />
                </View>
              </>
            )}
          </View>

          <Text
            className={`text-[26px] font-bold text-center mt-5 tracking-tight px-4 ${
              isFailed ? "text-red-600" : "text-primary"
            }`}
          >
            {heroTitle}
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-2 leading-relaxed px-6">
            {heroDescription}
          </Text>

          <View className="flex-row items-center gap-2 mt-5 bg-card border border-border rounded-full px-4 py-2">
            {isPaid ? (
              <ShieldCheck size={14} color="#16a34a" strokeWidth={2.4} />
            ) : isPending ? (
              <Hourglass size={14} color="#ea580c" strokeWidth={2.4} />
            ) : (
              <X size={14} color="#b91c1c" strokeWidth={2.4} />
            )}
            <Text className="text-xs font-semibold text-foreground">
              Mã booking:
            </Text>
            <Text className="text-xs font-bold text-primary tracking-wider">
              {bookingIdDisplay}
            </Text>
          </View>
        </View>

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="mx-4"
        >
          <View style={styles.cardShadow} className="rounded-2xl bg-card px-5 py-5">
            <InfoRow
              icon={Calendar}
              label="Ngày & giờ"
              value={formattedStartTime}
            />
            <View className="h-px bg-border my-4" />
            <InfoRow
              icon={MapPin}
              label="Địa điểm"
              value={garageName ?? "Garage đã chọn"}
            />
            <View className="h-px bg-border my-4" />
            <InfoRow
              icon={CarFront}
              label="Gói dịch vụ"
              value={serviceName ?? "Dịch vụ đã chọn"}
            />
            {vehiclePlate ? (
              <>
                <View className="h-px bg-border my-4" />
                <InfoRow
                  icon={Clock4}
                  label="Biển số xe"
                  value={vehiclePlate}
                />
              </>
            ) : null}

            <View className="h-px bg-border my-4" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-muted-foreground">Tổng cộng</Text>
                <Text className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Đã bao gồm VAT
                </Text>
              </View>
              <Text className="text-xl font-bold text-primary tracking-tight">
                {totalAmount}
              </Text>
            </View>

            <View className="h-px bg-border my-4" />
            <View className="flex-row items-center justify-between">
              <PaymentBadge label={params.paymentMethod ?? "UNPAID"} />
              {isPayosFlow ? (
                <View className="flex-row items-center gap-1.5">
                  {isPending ? (
                    <ActivityIndicator size="small" color="#1a5fd4" />
                  ) : isPaid ? (
                    <Check size={14} color="#16a34a" strokeWidth={3} />
                  ) : (
                    <X size={14} color="#b91c1c" strokeWidth={3} />
                  )}
                  <Text
                    className={`text-xs font-semibold ${
                      isPaid
                        ? "text-emerald-600"
                        : isPending
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {isPaid
                      ? "Đã thanh toán"
                      : isPending
                        ? "Đang chờ PayOS"
                        : "Chưa hoàn tất"}
                  </Text>
                </View>
              ) : (
                <View className="rounded-full bg-amber-100 px-2.5 py-1">
                  <Text className="text-[10px] font-bold text-amber-700">
                    CHƯA THANH TOÁN
                  </Text>
                </View>
              )}
            </View>

            {payment && isPayosFlow ? (
              <>
                <View className="h-px bg-border my-4" />
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-muted-foreground">
                      Mã giao dịch PayOS
                    </Text>
                    <Text className="text-xs font-semibold text-foreground">
                      #{payment.order_code}
                    </Text>
                  </View>
                  {payment.expires_at ? (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        Hết hạn
                      </Text>
                      <Text className="text-xs font-medium text-foreground">
                        {formatDateTimeLong(payment.expires_at)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}

            {booking?.payment_status ? (
              <>
                <View className="h-px bg-border my-4" />
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">
                    Trạng thái booking
                  </Text>
                  <Text className="text-xs font-semibold text-foreground">
                    {getBookingPaymentLabel(booking.payment_status)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </Animated.View>

        {isPending ? (
          <View className="px-4 mt-5">
            <View className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex-row gap-2.5">
              <RefreshCw size={16} color="#a16207" strokeWidth={2.4} />
              <Text className="text-xs text-amber-800 flex-1 leading-5">
                Hệ thống tự động kiểm tra trạng thái PayOS mỗi vài giây. Bạn
                cũng có thể kéo xuống để làm mới ngay.
              </Text>
            </View>
          </View>
        ) : null}

        {isFailed ? (
          <View className="px-4 mt-5 gap-3">
            <TouchableOpacity
              onPress={handleOpenDetail}
              activeOpacity={0.85}
              className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
            >
              <RefreshCw size={18} color="#ffffff" strokeWidth={2.6} />
              <Text className="text-white font-bold text-base">
                Thử thanh toán lại
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="px-4 mt-5 gap-3"
        >
          <TouchableOpacity
            onPress={handleOpenDetail}
            activeOpacity={0.85}
            className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
          >
            <Text className="text-white font-bold text-base">
              {isPaid ? "Xem chi tiết lịch hẹn" : "Xem lịch hẹn của tôi"}
            </Text>
            <ChevronRight size={20} color="#ffffff" strokeWidth={2.6} />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              className="flex-1 bg-card border border-border rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            >
              <LifeBuoy size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-primary font-semibold text-sm">
                Chia sẻ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackHome}
              activeOpacity={0.85}
              className="flex-1 bg-card border border-border rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            >
              <House size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-primary font-semibold text-sm">
                Trang chủ
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="items-center mt-6 px-8 gap-1"
        >
          <View className="flex-row items-center gap-1.5">
            <CircleHelp size={14} color="#7a8599" strokeWidth={2.2} />
            <Text className="text-xs text-muted-foreground">
              Bạn gặp vấn đề?
            </Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text className="text-xs font-semibold text-primary">
                Liên hệ hỗ trợ
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-[11px] text-muted-foreground/80 text-center leading-relaxed mt-2">
            Bạn có thể theo dõi trạng thái và thông tin thanh toán trong chi
            tiết lịch hẹn.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroBg: {
    backgroundColor: "#eaf1fb",
  },
  dot: {
    position: "absolute",
    backgroundColor: "#1a5fd4",
    borderRadius: 2,
  },
  checkStack: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(26,95,212,0.22)",
    backgroundColor: "rgba(26,95,212,0.04)",
  },
  ringMiddle: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2.5,
    borderColor: "rgba(26,95,212,0.45)",
    backgroundColor: "transparent",
  },
  ringInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#d6e4f7",
    shadowColor: "#1a5fd4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  cardShadow: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
});
