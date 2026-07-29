import { useCallback, useMemo, useState } from "react";
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
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  History,
  ShieldCheck,
  WalletCards,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type {
  BookingViolationAppeal,
  BookingViolationHistory,
  BookingViolationRiskStatus,
  BookingViolationStatus,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const riskContent: Record<
  BookingViolationRiskStatus,
  {
    label: string;
    description: string;
    background: string;
    foreground: string;
    icon: typeof ShieldCheck;
  }
> = {
  NORMAL: {
    label: "Độ tin cậy tốt",
    description: "Bạn có thể đặt lịch bình thường.",
    background: "#ecfdf5",
    foreground: "#047857",
    icon: ShieldCheck,
  },
  WARNING: {
    label: "Cần chú ý",
    description: "Hạn chế hủy lịch và vui lòng đến đúng giờ.",
    background: "#fffbeb",
    foreground: "#b45309",
    icon: AlertTriangle,
  },
  DEPOSIT_REQUIRED: {
    label: "Thuộc diện yêu cầu đặt cọc",
    description:
      "Lịch tiếp theo sẽ cần đặt cọc khi hệ thống bắt đầu áp dụng nghiệp vụ này.",
    background: "#eff6ff",
    foreground: "#1d4ed8",
    icon: WalletCards,
  },
  BLOCKED: {
    label: "Tạm khóa đặt lịch",
    description: "Bạn chưa thể tạo booking mới trong thời gian bị khóa.",
    background: "#fef2f2",
    foreground: "#b91c1c",
    icon: Ban,
  },
};

const eventLabels: Record<string, string> = {
  CANCEL: "Khách hủy lịch",
  LATE_CANCEL: "Hủy sát giờ",
  REPEATED_CANCEL: "Đặt và hủy liên tục",
  NO_SHOW: "Không đến",
  COMPLETED: "Hoàn thành và thanh toán",
  ADMIN_ADJUSTMENT: "Admin điều chỉnh",
  INACTIVITY_RECOVERY: "Phục hồi sau 60 ngày",
  APPEAL_REVERSAL: "Hoàn điểm do khiếu nại",
};

const appealLabels: Record<string, string> = {
  PENDING: "Đang chờ xử lý",
  APPROVED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
};

const rules = [
  { label: "Hủy trước từ 2 giờ trở lên", score: "+1" },
  { label: "Hủy trước dưới 2 giờ", score: "+2" },
  { label: "Không đến", score: "+3" },
  { label: "Từ 3 lần hủy trong 7 ngày", score: "+2 thêm" },
  { label: "Hoàn thành và thanh toán", score: "-1" },
  { label: "Không vi phạm trong 60 ngày", score: "-1" },
];

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Không thể tải thông tin độ tin cậy đặt lịch.";
}

export default function BookingReliabilityScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();
  const [status, setStatus] = useState<BookingViolationStatus | null>(null);
  const [history, setHistory] = useState<BookingViolationHistory[]>([]);
  const [appeals, setAppeals] = useState<BookingViolationAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      if (silent) setRefreshing(true);
      else setLoading(true);

      try {
        const [statusResponse, historyResponse, appealsResponse] =
          await Promise.all([
            api.getBookingViolationStatus(accessToken),
            api.getBookingViolationHistory(accessToken, {
              page: 1,
              limit: 100,
            }),
            api.getBookingViolationAppeals(accessToken, {
              page: 1,
              limit: 100,
            }),
          ]);
        setStatus(statusResponse.data);
        setHistory(historyResponse.data ?? []);
        setAppeals(appealsResponse.data ?? []);
      } catch (error) {
        Alert.alert("Không thể tải dữ liệu", getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      if (isHydrated && isAuthenticated) {
        void load();
      }
    }, [isAuthenticated, isHydrated, load])
  );

  const appealedEventIds = useMemo(
    () =>
      new Set(
        appeals
          .map((appeal) => appeal.event?.id)
          .filter((id): id is string => Boolean(id))
      ),
    [appeals]
  );

  if (!isHydrated || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải độ tin cậy đặt lịch" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Cần đăng nhập"
          description="Đăng nhập để xem điểm vi phạm và lịch sử đặt lịch."
          actionLabel="Đăng nhập"
          onAction={() => router.replace("/login")}
        />
      </SafeAreaView>
    );
  }

  const currentStatus = status ?? {
    customer_id: null,
    violation_score: 0,
    risk_status: "NORMAL" as const,
    warning_required: false,
    deposit_required: false,
    booking_blocked: false,
    booking_blocked_until: null,
    booking_block_count: 0,
    last_violation_at: null,
    last_event_at: null,
    last_recovery_at: null,
    thresholds: { warning: 3, deposit_required: 5, blocked: 6 },
  };
  const risk = riskContent[currentStatus.risk_status];
  const RiskIcon = risk.icon;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
        >
          <ArrowLeft size={20} color="#111827" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            Độ tin cậy đặt lịch
          </Text>
          <Text className="text-xs text-muted-foreground">
            Điểm vi phạm tách biệt với điểm thưởng
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
      >
        <View
          className="rounded-3xl p-5"
          style={{ backgroundColor: risk.background }}
        >
          <View className="flex-row items-center gap-4">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl bg-white"
              style={{ shadowColor: risk.foreground, elevation: 2 }}
            >
              <RiskIcon size={28} color={risk.foreground} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text
                className="text-base font-bold"
                style={{ color: risk.foreground }}
              >
                {risk.label}
              </Text>
              <Text
                className="mt-1 text-sm leading-5"
                style={{ color: risk.foreground }}
              >
                {risk.description}
              </Text>
            </View>
            <View className="items-center">
              <Text
                className="text-3xl font-black"
                style={{ color: risk.foreground }}
              >
                {currentStatus.violation_score}
              </Text>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: risk.foreground }}
              >
                điểm
              </Text>
            </View>
          </View>
          {currentStatus.booking_blocked_until ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5">
              <Clock3 size={16} color={risk.foreground} strokeWidth={2.2} />
              <Text className="flex-1 text-xs" style={{ color: risk.foreground }}>
                Khóa đến {formatDateTime(currentStatus.booking_blocked_until)}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-5 rounded-3xl bg-card p-5">
          <Text className="text-base font-bold text-foreground">
            Mức xử lý
          </Text>
          <View className="mt-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">0–2 điểm</Text>
              <Text className="text-sm font-semibold text-emerald-700">
                Bình thường
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">3–4 điểm</Text>
              <Text className="text-sm font-semibold text-amber-700">
                Cảnh báo
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">5 điểm</Text>
              <Text className="text-sm font-semibold text-blue-700">
                Diện đặt cọc
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">Từ 6 điểm</Text>
              <Text className="text-sm font-semibold text-red-700">
                Khóa 3 / 7 / 14 / 30 ngày
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 rounded-3xl bg-card p-5">
          <Text className="text-base font-bold text-foreground">
            Cách tính điểm
          </Text>
          <View className="mt-3 divide-y divide-border">
            {rules.map((rule) => (
              <View
                key={rule.label}
                className="flex-row items-center justify-between py-3"
              >
                <Text className="flex-1 pr-3 text-sm text-muted-foreground">
                  {rule.label}
                </Text>
                <Text
                  className={`text-sm font-bold ${
                    rule.score.startsWith("+")
                      ? "text-red-600"
                      : "text-emerald-700"
                  }`}
                >
                  {rule.score}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-5">
          <View className="mb-3 flex-row items-center gap-2">
            <History size={18} color="#111827" strokeWidth={2.2} />
            <Text className="text-base font-bold text-foreground">
              Lịch sử điểm
            </Text>
          </View>
          {history.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-border bg-card p-7">
              <CheckCircle2 size={28} color="#059669" strokeWidth={2} />
              <Text className="mt-3 font-bold text-foreground">
                Chưa có sự kiện vi phạm
              </Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Lịch sử cộng, trừ điểm sẽ hiển thị tại đây.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {history.map((item) => {
                const canAppeal =
                  item.source === "BOOKING_EVENT" &&
                  item.score_change > 0 &&
                  !item.is_reversed &&
                  !appealedEventIds.has(item.id);

                return (
                  <View key={`${item.source}-${item.id}`} className="rounded-2xl bg-card p-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-bold text-foreground">
                          {eventLabels[item.event] ?? item.event}
                        </Text>
                        <Text className="mt-1 text-xs text-muted-foreground">
                          {item.booking_code
                            ? `Booking ${item.booking_code} · `
                            : ""}
                          {formatDateTime(item.created_at)}
                        </Text>
                      </View>
                      <View
                        className={`rounded-full px-3 py-1 ${
                          item.score_change > 0
                            ? "bg-red-50"
                            : item.score_change < 0
                              ? "bg-emerald-50"
                              : "bg-slate-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            item.score_change > 0
                              ? "text-red-700"
                              : item.score_change < 0
                                ? "text-emerald-700"
                                : "text-slate-600"
                          }`}
                        >
                          {item.score_change > 0 ? "+" : ""}
                          {item.score_change} điểm
                        </Text>
                      </View>
                    </View>
                    {item.reason ? (
                      <Text className="mt-3 text-sm leading-5 text-muted-foreground">
                        {item.reason}
                      </Text>
                    ) : null}
                    {item.is_reversed ? (
                      <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                        <CheckCircle2
                          size={15}
                          color="#047857"
                          strokeWidth={2.2}
                        />
                        <Text className="flex-1 text-xs text-emerald-700">
                          Sự kiện đã được hoàn điểm.
                        </Text>
                      </View>
                    ) : null}
                    {canAppeal ? (
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/booking-violation-appeal",
                            params: {
                              eventId: item.id,
                              eventLabel: eventLabels[item.event] ?? item.event,
                              bookingCode: item.booking_code ?? "",
                            },
                          } as never)
                        }
                        className="mt-3 flex-row items-center justify-between rounded-xl bg-blue-50 px-3 py-3"
                      >
                        <View className="flex-row items-center gap-2">
                          <FileQuestion
                            size={16}
                            color="#1d4ed8"
                            strokeWidth={2.2}
                          />
                          <Text className="text-sm font-semibold text-blue-700">
                            Khiếu nại sự kiện này
                          </Text>
                        </View>
                        <ChevronRight
                          size={17}
                          color="#1d4ed8"
                          strokeWidth={2.2}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {appeals.length > 0 ? (
          <View className="mt-5">
            <Text className="mb-3 text-base font-bold text-foreground">
              Khiếu nại đã gửi
            </Text>
            <View className="gap-3">
              {appeals.map((appeal) => (
                <View key={appeal.id} className="rounded-2xl bg-card p-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 font-semibold text-foreground">
                      {appeal.event
                        ? eventLabels[appeal.event.event] ?? appeal.event.event
                        : "Sự kiện điểm vi phạm"}
                    </Text>
                    <Text
                      className={`text-xs font-bold ${
                        appeal.status === "APPROVED"
                          ? "text-emerald-700"
                          : appeal.status === "REJECTED"
                            ? "text-red-700"
                            : "text-amber-700"
                      }`}
                    >
                      {appealLabels[appeal.status] ?? appeal.status}
                    </Text>
                  </View>
                  <Text className="mt-2 text-sm text-muted-foreground">
                    {appeal.reason}
                  </Text>
                  {appeal.admin_note ? (
                    <View className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <Text className="text-xs font-semibold text-slate-700">
                        Kết luận từ Admin
                      </Text>
                      <Text className="mt-1 text-sm text-slate-600">
                        {appeal.admin_note}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
