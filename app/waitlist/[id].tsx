import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  Bell,
  CalendarClock,
  CarFront,
  CheckCircle2,
  CircleCheck,
  CircleX,
  Clock4,
  Coins,
  Hourglass,
  MapPin,
  NotebookPen,
  Repeat,
  Sparkles,
  TimerReset,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import TextInputDialog from "@/components/common/TextInputDialog";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatRemaining } from "@/lib/format";
import type { Waitlist } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function WaitlistDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const waitlistId = params.id;
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [item, setItem] = useState<Waitlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!accessToken || !waitlistId) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const response = await api.getWaitlist(accessToken, waitlistId);
        setItem(response.data);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải chi tiết.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, waitlistId]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated && waitlistId) void load();
  }, [isHydrated, isAuthenticated, waitlistId, load]);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !waitlistId) return;
    if (item?.status !== "OFFERED") return;
    const id = setInterval(() => {
      void load(true);
    }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.status, isHydrated, isAuthenticated, waitlistId]);

  const handleAccept = async () => {
    if (!accessToken || !waitlistId) return;
    setBusy(true);
    try {
      const response = await api.acceptWaitlist(accessToken, waitlistId);
      const bookingId = response.data?.created_booking_id;
      Alert.alert(
        "Đã đặt lịch",
        bookingId
          ? "Yêu cầu chờ đã được chuyển thành booking. Tiến hành thanh toán nhé!"
          : "Yêu cầu chờ đã được chấp nhận.",
        [
          {
            text: "Xem booking",
            onPress: () => {
              if (bookingId) {
                router.replace(`/booking-detail?id=${bookingId}` as const);
              } else {
                router.replace("/waitlist");
              }
            },
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể chấp nhận slot.";
      Alert.alert("Lỗi", message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setCancelReason("");
    setCancelDialog(true);
  };

  const submitCancel = async () => {
    if (!accessToken || !waitlistId) return;
    setBusy(true);
    try {
      await api.cancelWaitlist(
        accessToken,
        waitlistId,
        cancelReason.trim() || undefined
      );
      setCancelDialog(false);
      await load(true);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể huỷ.";
      Alert.alert("Lỗi", message);
    } finally {
      setBusy(false);
    }
  };

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
          title="Phiên đã hết"
          description="Đăng nhập lại để xem chi tiết."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (!item) {
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
          description="Yêu cầu chờ này không còn tồn tại."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const garageName = item.garage?.name ?? "Garage";
  const serviceName = item.service_package?.name ?? "Dịch vụ";
  const vehiclePlate = item.vehicle?.raw_license_plate ?? "—";

  const isOffered = item.status === "OFFERED";
  const isOpen = item.status === "WAITING" || item.status === "OFFERED";

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
            Chi tiết chờ slot
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Mã: {item.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <StatusBadge status={item.status} />
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
          {isOffered ? (
            <OfferBanner
              expiresAt={item.offer_expires_at ?? null}
              onAccept={handleAccept}
              busy={busy}
            />
          ) : null}

          <View className="rounded-2xl bg-card border border-border p-5">
            <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Dịch vụ
            </Text>
            <Text className="text-base font-bold text-foreground mt-1">
              {serviceName}
            </Text>

            <View className="h-px bg-border my-4" />

            <View className="gap-3">
              <Row icon={MapPin} label="Garage" value={garageName} />
              <Row
                icon={CarFront}
                label="Phương tiện"
                value={`${vehiclePlate}${
                  item.vehicle?.brand
                    ? ` • ${[item.vehicle.brand, item.vehicle.model].filter(Boolean).join(" ")}`
                    : ""
                }`}
              />
              <Row
                icon={CalendarClock}
                label="Thời gian mong muốn"
                value={formatDateTime(item.desired_start_time)}
              />
              {item.accepted_at ? (
                <Row
                  icon={CircleCheck}
                  label="Đã chấp nhận"
                  value={formatDateTime(item.accepted_at)}
                />
              ) : null}
              {item.canceled_at ? (
                <Row
                  icon={CircleX}
                  label="Đã huỷ"
                  value={formatDateTime(item.canceled_at)}
                />
              ) : null}
              {item.expired_at ? (
                <Row
                  icon={Clock4}
                  label="Hết hạn"
                  value={formatDateTime(item.expired_at)}
                />
              ) : null}
              {item.cancel_reason ? (
                <Row
                  icon={NotebookPen}
                  label="Lý do huỷ"
                  value={item.cancel_reason}
                />
              ) : null}
              {item.note ? (
                <Row icon={NotebookPen} label="Ghi chú" value={item.note} />
              ) : null}
            </View>
          </View>

          {item.created_booking ? (
            <View className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
              <View className="flex-row items-center gap-2 mb-1">
                <CircleCheck size={16} color="#15803d" strokeWidth={2.4} />
                <Text className="text-sm font-bold text-emerald-700">
                  Đã tạo booking
                </Text>
              </View>
              <Text className="text-xs text-emerald-700 mb-3">
                Booking {item.created_booking.id.slice(0, 8).toUpperCase()} •{" "}
                {formatDateTime(item.created_booking.start_time ?? new Date().toISOString())}
              </Text>
              <LoadingButton
                title="Xem booking"
                onPress={() =>
                  router.replace(
                    `/booking-detail?id=${item.created_booking?.id}` as const
                  )
                }
                variant="secondary"
                icon={Repeat}
              />
            </View>
          ) : null}

          {isOpen ? (
            <LoadingButton
              title="Huỷ yêu cầu chờ"
              variant="danger"
              onPress={handleCancel}
              disabled={busy}
              icon={CircleX}
            />
          ) : null}
        </View>
      </ScrollView>

      <TextInputDialog
        visible={cancelDialog}
        title="Huỷ yêu cầu chờ"
        description="Tuỳ chọn: cho garage biết lý do bạn huỷ để cải thiện dịch vụ."
        placeholder="Ví dụ: Đã đặt được ở garage khác, không còn cần..."
        value={cancelReason}
        onChangeText={setCancelReason}
        confirmLabel="Xác nhận huỷ"
        confirmVariant="danger"
        onConfirm={submitCancel}
        onCancel={() => setCancelDialog(false)}
        loading={busy}
      />
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
      className="flex-row items-center gap-1 px-2 py-1 rounded-full"
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

function OfferBanner({
  expiresAt,
  onAccept,
  busy,
}: {
  expiresAt: string | null;
  onAccept: () => void;
  busy: boolean;
}) {
  return (
    <View className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <Bell size={16} color="#a16207" strokeWidth={2.4} />
        <Text className="text-sm font-bold text-amber-800">
          Garage có slot trống!
        </Text>
      </View>
      <Text className="text-xs text-amber-700 leading-5 mb-3">
        Chúng tôi đã tìm thấy slot phù hợp. Hãy xác nhận trước khi hết hạn để
        giữ chỗ.
      </Text>
      {expiresAt ? (
        <View className="flex-row items-center gap-2 mb-3">
          <TimerReset size={14} color="#a16207" strokeWidth={2.4} />
          <Text className="text-xs font-semibold text-amber-800">
            Hết hạn sau: {formatRemaining(expiresAt)}
          </Text>
        </View>
      ) : null}
      <LoadingButton
        title="Chấp nhận slot ngay"
        onPress={onAccept}
        loading={busy}
        icon={CheckCircle2}
      />
    </View>
  );
}

function Row({
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

export default function WaitlistDetailScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi chi tiết chờ slot">
      <WaitlistDetailScreen />
    </ErrorBoundary>
  );
}
