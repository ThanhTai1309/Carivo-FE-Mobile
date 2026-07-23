import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
  AlertTriangle,
  CalendarClock,
  CarFront,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock4,
  Coins,
  CreditCard,
  ExternalLink,
  Hash,
  Info,
  MapPin,
  Receipt,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Star,
  Wrench,
  X,
  XCircle,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import {
  formatCurrency,
  formatDateLabel,
  formatDateTime,
  formatDateTimeLong,
} from "@/lib/format";
import type {
  Booking,
  BookingInspection,
  PaymentTransaction,
  WashHistory,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  state: "done" | "current" | "pending";
  timestamp?: string;
}

const STATUS_LABELS: Record<string, { label: string; tone: string; palette: { bg: string; fg: string } }> = {
  PENDING: {
    label: "Chờ xác nhận",
    tone: "warning",
    palette: { bg: "#fef3c7", fg: "#a16207" },
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    tone: "info",
    palette: { bg: "#dbe7fb", fg: "#1a5fd4" },
  },
  CHECKED_IN: {
    label: "Đã check-in",
    tone: "info",
    palette: { bg: "#ede9fe", fg: "#6d28d9" },
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    tone: "active",
    palette: { bg: "#cffafe", fg: "#0e7490" },
  },
  COMPLETED: {
    label: "Hoàn thành",
    tone: "success",
    palette: { bg: "#dcfce7", fg: "#15803d" },
  },
  CANCELED: {
    label: "Đã hủy",
    tone: "danger",
    palette: { bg: "#fee2e2", fg: "#b91c1c" },
  },
  NO_SHOW: {
    label: "Không đến",
    tone: "muted",
    palette: { bg: "#f1f5f9", fg: "#475569" },
  },
};

function StatusBadge({ status }: { status: Booking["status"] }) {
  const entry = STATUS_LABELS[status] ?? STATUS_LABELS.PENDING;
  return (
    <View
      style={{ backgroundColor: entry.palette.bg }}
      className="self-start px-3 py-1 rounded-full"
    >
      <Text
        style={{ color: entry.palette.fg }}
        className="text-xs font-bold tracking-wide"
      >
        {entry.label}
      </Text>
    </View>
  );
}

function TimelineRow({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const Icon = step.icon;
  const isDone = step.state === "done";
  const isCurrent = step.state === "current";
  const accentBg = isDone ? "#dcfce7" : isCurrent ? "#dbe7fb" : "#f1f5f9";
  const accentFg = isDone ? "#15803d" : isCurrent ? "#1a5fd4" : "#94a3b8";

  return (
    <View className="flex-row gap-3">
      <View className="items-center" style={{ width: 40 }}>
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: accentBg }}
        >
          <Icon size={18} color={accentFg} strokeWidth={2.2} />
        </View>
        {!isLast ? (
          <View
            className="flex-1 w-0.5 my-1"
            style={{
              backgroundColor: isDone ? "#86efac" : "#e2e8f0",
              minHeight: 24,
            }}
          />
        ) : null}
      </View>
      <View className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
        <Text
          className={`text-sm font-semibold ${
            isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {step.label}
        </Text>
        {step.description ? (
          <Text className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {step.description}
          </Text>
        ) : null}
        {step.timestamp ? (
          <View className="flex-row items-center gap-1 mt-1">
            <Clock4 size={11} color="#7a8599" strokeWidth={2.2} />
            <Text className="text-[11px] text-muted-foreground">
              {formatDateTime(step.timestamp)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function buildTimelineSteps(
  booking: Booking,
  inspectionCount: number,
  wash: WashHistory | null
): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const order = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"];
  const currentIdx = order.indexOf(booking.status);

  // Step 1: Booking placed
  steps.push({
    id: "placed",
    label: "Đặt lịch thành công",
    description: `Mã booking: ${booking.id.slice(0, 8).toUpperCase()}`,
    icon: Receipt,
    state: currentIdx >= 0 ? "done" : "pending",
    timestamp: booking.start_time,
  });

  // Step 2: Confirmed by garage
  steps.push({
    id: "confirmed",
    label: "Garage xác nhận",
    description:
      booking.status === "CONFIRMED" || currentIdx >= 1
        ? "Đã được garage xác nhận"
        : "Đang chờ garage xác nhận",
    icon: ShieldCheck,
    state: currentIdx >= 1 ? "done" : currentIdx === 0 ? "current" : "pending",
  });

  // Step 3: Check-in
  steps.push({
    id: "checkin",
    label: "Check-in tại garage",
    description:
      booking.status === "CHECKED_IN" || currentIdx >= 2
        ? "Bạn đã đến garage"
        : "Đến garage đúng giờ hẹn",
    icon: MapPin,
    state: currentIdx >= 2 ? "done" : "pending",
  });

  // Step 4: Service in progress + inspection
  if (booking.status === "IN_PROGRESS" || currentIdx >= 3) {
    steps.push({
      id: "service",
      label: "Đang thực hiện dịch vụ",
      description:
        inspectionCount > 0
          ? `${inspectionCount} lượt kiểm tra đã ghi nhận`
          : "Đội ngũ garage đang xử lý xe của bạn",
      icon: Wrench,
      state: currentIdx >= 3 ? "done" : "current",
    });
  } else {
    steps.push({
      id: "service",
      label: "Thực hiện dịch vụ",
      description: "Bao gồm rửa xe, kiểm tra tình trạng và đánh bóng",
      icon: Wrench,
      state: "pending",
    });
  }

  // Step 5: Completed
  steps.push({
    id: "completed",
    label: "Hoàn thành",
    description:
      booking.status === "COMPLETED"
        ? "Cảm ơn bạn đã sử dụng Carivo"
        : "Sau khi hoàn tất sẽ có thông báo",
    icon: CircleCheck,
    state: currentIdx >= 4 ? "done" : "pending",
    timestamp: wash?.service_completed_at,
  });

  return steps;
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const bookingId = params.id;
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [inspections, setInspections] = useState<BookingInspection[]>([]);
  const [wash, setWash] = useState<WashHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payosPayment, setPayosPayment] = useState<PaymentTransaction | null>(
    null
  );
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!accessToken || !bookingId) return;

      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const bookingResponse = await api.getBooking(accessToken, bookingId);
        const fetchedBooking = bookingResponse.data;
        setBooking(fetchedBooking);

        const [inspectionResponse, washListResponse, payosResponse] =
          await Promise.all([
            (api.getBookingInspections(accessToken, bookingId) as Promise<
              Awaited<ReturnType<typeof api.getBookingInspections>>
            >).catch(
              () =>
                ({
                  success: true,
                  data: [] as BookingInspection[],
                }) as Awaited<
                  ReturnType<typeof api.getBookingInspections>
                >
            ),
            api.getWashHistories(accessToken, { booking_id: bookingId }).catch(
              () =>
                ({
                  success: true,
                  data: [] as WashHistory[],
                }) as Awaited<
                  ReturnType<typeof api.getWashHistories>
                >
            ),
            api.getPayosPayment(accessToken, bookingId).catch(() => null),
          ]);

        setInspections(inspectionResponse.data ?? []);
        const washData = (washListResponse.data ?? [])[0] ?? null;
        setWash(washData);

        const payosData = payosResponse?.data?.payment ?? null;
        setPayosPayment(payosData);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải chi tiết lịch hẹn.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, bookingId]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated && bookingId) {
      void loadData();
    }
  }, [isHydrated, isAuthenticated, bookingId, loadData]);

  const handleCancel = () => {
    if (!booking) return;
    Alert.alert(
      "Hủy lịch hẹn",
      "Bạn có chắc muốn hủy lịch này? Hành động không thể hoàn tác.",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy lịch",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              if (!accessToken || !booking) return;
              await api.cancelBooking(
                accessToken,
                booking.id,
                "Khách hủy từ app"
              );
              await loadData(true);
              Alert.alert("Thành công", "Đã hủy lịch hẹn.");
            } catch (error) {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "Không thể hủy lịch.";
              Alert.alert("Lỗi", message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleRebook = () => {
    router.push({
      pathname: "/(tabs)/booking",
      params: {
        garageId: booking?.garage_id,
        servicePackageId: booking?.service_package_id,
        vehicleId: booking?.vehicle_id ?? undefined,
      },
    });
  };

  const handlePayNow = async () => {
    if (!accessToken || !booking) return;
    setOpeningCheckout(true);
    try {
      const paymentResponse = await api.createPayosPayment(
        accessToken,
        booking.id
      );
      const checkoutUrl = paymentResponse.data?.payment?.checkout_url;
      if (!checkoutUrl) {
        Alert.alert(
          "Không có liên kết thanh toán",
          "Vui lòng thử lại sau ít phút."
        );
        return;
      }
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (!supported) {
        Alert.alert(
          "Không thể mở liên kết",
          "Thiết bị không hỗ trợ mở liên kết thanh toán."
        );
        return;
      }
      await Linking.openURL(checkoutUrl);
      router.push({
        pathname: "/payment-success",
        params: {
          bookingId: booking.id,
          total: String(booking.final_price ?? booking.original_price ?? 0),
          paymentMethod: "PAYOS",
          pending: "1",
          garageName: booking.garage?.name,
          serviceName: booking.service_package?.name,
          startTime: booking.start_time,
          vehiclePlate: booking.vehicle?.raw_license_plate,
        },
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể khởi tạo thanh toán.";
      Alert.alert("Lỗi thanh toán", message);
    } finally {
      setOpeningCheckout(false);
    }
  };

  const handleCancelPayos = () => {
    if (!accessToken || !payosPayment) return;
    Alert.alert(
      "Hủy thanh toán PayOS",
      "Bạn có chắc muốn hủy giao dịch PayOS đang chờ? Bạn có thể tạo lại liên kết thanh toán sau.",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy thanh toán",
          style: "destructive",
          onPress: async () => {
            setCancellingPayment(true);
            try {
              await api.cancelPayosPayment(
                accessToken,
                payosPayment.id,
                "Customer hủy từ app"
              );
              await loadData(true);
              Alert.alert("Thành công", "Đã hủy giao dịch PayOS.");
            } catch (error) {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "Không thể hủy thanh toán.";
              Alert.alert("Lỗi", message);
            } finally {
              setCancellingPayment(false);
            }
          },
        },
      ]
    );
  };

  const timelineSteps = useMemo(
    () => (booking ? buildTimelineSteps(booking, inspections.length, wash) : []),
    [booking, inspections.length, wash]
  );

  const canCancel =
    booking && (booking.status === "PENDING" || booking.status === "CONFIRMED");
  const canRebook = booking && booking.status === "COMPLETED";
  const isPayosPending =
    payosPayment &&
    (payosPayment.status === "PENDING" ||
      payosPayment.status === "INITIATED" ||
      payosPayment.status === "CANCELING");
  const canPayNow =
    booking &&
    booking.status === "COMPLETED" &&
    booking.payment_status !== "PAID" &&
    !isPayosPending;
  const canCancelPayos = booking && booking.status === "COMPLETED" && isPayosPending;

  if (!isHydrated || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải chi tiết" description="Vui lòng chờ" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Phiên đăng nhập đã hết"
          description="Vui lòng đăng nhập để xem chi tiết."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
          description="Lịch hẹn này có thể đã bị xoá hoặc không thuộc tài khoản của bạn."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const serviceName =
    booking.service_package?.name ?? booking.service_package_id;
  const garageName = booking.garage?.name ?? booking.garage_id;
  const shortId = booking.id.slice(0, 8).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
          />
        }
      >
        {/* Header */}
        <View className="px-4 pt-3 pb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-base font-bold text-foreground">
            Chi tiết lịch hẹn
          </Text>
          <TouchableOpacity
            onPress={() => loadData(true)}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <RefreshCw size={18} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View className="mx-4 rounded-3xl bg-card p-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Dịch vụ
              </Text>
              <Text className="text-lg font-bold text-foreground mt-1">
                {serviceName}
              </Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>

          <View className="h-px bg-border my-4" />

          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
                <MapPin size={16} color="#1a5fd4" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Garage
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {garageName}
                </Text>
                {booking.garage?.address ? (
                  <Text
                    className="text-[11px] text-muted-foreground mt-0.5"
                    numberOfLines={2}
                  >
                    {booking.garage.address}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
                <CalendarClock size={16} color="#1a5fd4" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Bắt đầu
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {formatDateTimeLong(booking.start_time)}
                </Text>
                {booking.end_time ? (
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    Dự kiến kết thúc: {formatDateTime(booking.end_time)}
                  </Text>
                ) : null}
              </View>
            </View>

            {booking.vehicle ? (
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
                  <CarFront size={16} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Phương tiện
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {booking.vehicle.raw_license_plate}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    {[
                      booking.vehicle.brand,
                      booking.vehicle.model,
                      booking.vehicle.color,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
                <Hash size={16} color="#1a5fd4" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Mã booking
                </Text>
                <Text
                  className="text-sm font-bold text-primary tracking-wider"
                  style={{ letterSpacing: 1.5 }}
                >
                  {shortId}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View className="mx-4 mt-4 rounded-3xl bg-card p-5">
          <View className="flex-row items-center gap-2 mb-4">
            <ClipboardList size={18} color="#1a5fd4" strokeWidth={2.2} />
            <Text className="text-base font-bold text-foreground">
              Tiến trình dịch vụ
            </Text>
          </View>
          {timelineSteps.map((step, idx) => (
            <TimelineRow
              key={step.id}
              step={step}
              isLast={idx === timelineSteps.length - 1}
            />
          ))}
        </View>

        {/* Payment summary */}
        <View className="mx-4 mt-4 rounded-3xl bg-card p-5">
          <View className="flex-row items-center gap-2 mb-4">
            <Receipt size={18} color="#1a5fd4" strokeWidth={2.2} />
            <Text className="text-base font-bold text-foreground">
              Chi tiết thanh toán
            </Text>
          </View>

          <View className="gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                Giá gốc
              </Text>
              <Text className="text-sm font-medium text-foreground">
                {formatCurrency(booking.original_price)}
              </Text>
            </View>
            {booking.discount_amount && booking.discount_amount > 0 ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Giảm giá (promo)
                </Text>
                <Text className="text-sm font-medium text-emerald-600">
                  −{formatCurrency(booking.discount_amount)}
                </Text>
              </View>
            ) : null}
            {booking.used_points && booking.used_points > 0 ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Điểm đã dùng
                </Text>
                <Text className="text-sm font-medium text-amber-700">
                  −{booking.used_points} điểm
                </Text>
              </View>
            ) : null}
            {booking.voucher_discount_amount &&
            booking.voucher_discount_amount > 0 ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Giảm giá voucher
                </Text>
                <Text className="text-sm font-medium text-emerald-600">
                  −{formatCurrency(booking.voucher_discount_amount)}
                </Text>
              </View>
            ) : null}
            <View className="h-px bg-border my-1" />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">
                Thành tiền
              </Text>
              <Text className="text-lg font-bold text-primary">
                {formatCurrency(
                  booking.final_price ?? booking.original_price
                )}
              </Text>
            </View>
            {wash?.payment_method ? (
              <View className="flex-row items-center justify-between mt-1">
                <View className="flex-row items-center gap-1.5">
                  <CreditCard size={13} color="#7a8599" strokeWidth={2.2} />
                  <Text className="text-xs text-muted-foreground">
                    Phương thức
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-foreground">
                  {wash.payment_method}
                </Text>
              </View>
            ) : null}
            {wash?.paid_at ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Clock4 size={13} color="#7a8599" strokeWidth={2.2} />
                  <Text className="text-xs text-muted-foreground">
                    Thanh toán lúc
                  </Text>
                </View>
                <Text className="text-xs font-medium text-foreground">
                  {formatDateTime(wash.paid_at)}
                </Text>
              </View>
            ) : null}
            {typeof booking.earned_points === "number" &&
            booking.earned_points > 0 ? (
              <View className="mt-2 rounded-xl bg-amber-50 p-3 flex-row items-center gap-2.5">
                <Coins size={18} color="#a16207" strokeWidth={2.4} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-amber-800">
                    Điểm thưởng tích lũy
                  </Text>
                  <Text className="text-[11px] text-amber-700 mt-0.5">
                    Hoàn thành dịch vụ giúp tích lũy điểm thưởng.
                  </Text>
                </View>
                <Text className="text-base font-bold text-amber-700">
                  +{booking.earned_points}
                </Text>
              </View>
            ) : null}
            {booking.promotion ? (
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-xs text-muted-foreground">
                  Mã khuyến mãi
                </Text>
                <Text className="text-xs font-bold text-primary uppercase">
                  {booking.promotion.code}
                </Text>
              </View>
            ) : null}
            {booking.customer_voucher ? (
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-xs text-muted-foreground">
                  Mã voucher
                </Text>
                <Text className="text-xs font-bold text-primary uppercase">
                  {booking.customer_voucher.code ?? "Đã áp dụng"}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Inspection report */}
        {inspections.length > 0 ? (
          <View className="mx-4 mt-4 rounded-3xl bg-card p-5">
            <View className="flex-row items-center gap-2 mb-4">
              <Wrench size={18} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-base font-bold text-foreground">
                Báo cáo kiểm tra ({inspections.length})
              </Text>
            </View>
            {inspections.map((report, idx) => (
              <View
                key={report.id}
                className={`rounded-2xl border border-border p-3 ${
                  idx > 0 ? "mt-3" : ""
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-foreground">
                    Lượt #{idx + 1}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {formatDateTime(report.created_at)}
                  </Text>
                </View>
                {report.vehicle_condition ? (
                  <View className="flex-row items-start gap-1.5 mt-2">
                    <Info size={12} color="#7a8599" strokeWidth={2.2} />
                    <Text className="flex-1 text-xs text-foreground leading-relaxed">
                      {report.vehicle_condition}
                    </Text>
                  </View>
                ) : null}
                {report.notes ? (
                  <Text className="text-[11px] text-muted-foreground mt-2 italic">
                    "{report.notes}"
                  </Text>
                ) : null}
                {report.inspection_images &&
                report.inspection_images.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, marginTop: 10 }}
                  >
                    {report.inspection_images.map((uri, imageIdx) => (
                      <Image
                        key={imageIdx}
                        source={{ uri }}
                        className="w-20 h-20 rounded-lg"
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Payment banner for UNPAID completed bookings */}
        {canPayNow ? (
          <View className="mx-4 mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex-row gap-3">
            <AlertTriangle size={20} color="#a16207" strokeWidth={2.4} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-amber-800">
                Lịch hẹn chưa được thanh toán
              </Text>
              <Text className="text-xs text-amber-700 mt-1 leading-5">
                Garage đã hoàn tất dịch vụ. Vui lòng thanh toán{" "}
                {formatCurrency(
                  booking.final_price ?? booking.original_price ?? 0
                )}{" "}
                để hoàn tất.
              </Text>
            </View>
          </View>
        ) : null}

        {isPayosPending && booking ? (
          <View className="mx-4 mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 gap-2">
            <View className="flex-row items-center gap-2">
              <CreditCard size={18} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="text-sm font-bold text-blue-800">
                Đang chờ thanh toán PayOS
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-blue-700">Mã giao dịch</Text>
              <Text className="text-xs font-bold text-blue-900">
                #{payosPayment?.order_code}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-blue-700">Số tiền</Text>
              <Text className="text-xs font-bold text-blue-900">
                {formatCurrency(payosPayment?.amount ?? 0)}
              </Text>
            </View>
            {payosPayment?.expires_at ? (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-blue-700">Hết hạn</Text>
                <Text className="text-xs font-medium text-blue-900">
                  {formatDateTime(payosPayment.expires_at)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Actions */}
        <View className="px-4 mt-6 gap-3">
          {canPayNow ? (
            <TouchableOpacity
              onPress={handlePayNow}
              disabled={openingCheckout}
              activeOpacity={0.85}
              className="rounded-2xl bg-primary py-4 flex-row items-center justify-center gap-2"
              style={{
                shadowColor: "#1a5fd4",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              {openingCheckout ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <CreditCard size={18} color="#ffffff" strokeWidth={2.4} />
                  <Text className="text-white font-bold text-base">
                    Thanh toán ngay qua PayOS
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          {canCancelPayos ? (
            <TouchableOpacity
              onPress={handleCancelPayos}
              disabled={cancellingPayment}
              activeOpacity={0.85}
              className="rounded-2xl border border-slate-300 bg-white py-3.5 flex-row items-center justify-center gap-2"
            >
              {cancellingPayment ? (
                <ActivityIndicator color="#475569" />
              ) : (
                <>
                  <XCircle size={16} color="#475569" strokeWidth={2.4} />
                  <Text className="text-slate-700 font-semibold text-sm">
                    Hủy giao dịch PayOS đang chờ
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          {canCancel ? (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.85}
              className="rounded-2xl border border-red-400 bg-red-50 py-4 flex-row items-center justify-center gap-2"
            >
              {cancelling ? (
                <ActivityIndicator color="#b91c1c" />
              ) : (
                <>
                  <X size={18} color="#b91c1c" strokeWidth={2.4} />
                  <Text className="text-red-600 font-bold text-base">
                    Hủy lịch hẹn
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
          {canRebook ? (
            <TouchableOpacity
              onPress={handleRebook}
              activeOpacity={0.85}
              className="rounded-2xl bg-primary py-4 flex-row items-center justify-center gap-2"
              style={{
                shadowColor: "#1a5fd4",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <RotateCcw size={18} color="#ffffff" strokeWidth={2.4} />
              <Text className="text-white font-bold text-base">
                Đặt lại dịch vụ này
              </Text>
            </TouchableOpacity>
          ) : null}
          {booking.status === "COMPLETED" ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/profile",
                })
              }
              activeOpacity={0.7}
              className="rounded-2xl bg-card border border-border py-3.5 flex-row items-center justify-center gap-2"
            >
              <Star size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-primary font-semibold text-sm">
                Đánh giá dịch vụ
              </Text>
              <ExternalLink size={14} color="#1a5fd4" strokeWidth={2.4} />
            </TouchableOpacity>
          ) : null}
          {booking.note ? (
            <View className="flex-row items-start gap-2 rounded-xl bg-secondary px-3 py-2.5">
              <Info size={14} color="#1a5fd4" strokeWidth={2.2} />
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-primary">
                  Ghi chú của bạn
                </Text>
                <Text className="text-xs text-foreground mt-0.5 italic">
                  "{booking.note}"
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
