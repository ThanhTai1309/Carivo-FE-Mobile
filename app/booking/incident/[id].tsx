import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock4,
  Hourglass,
  RefreshCcw,
  Wrench,
  X,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type {
  BookingIncident,
  BookingIncidentActiveResponse,
  BookingIncidentDecision,
  IncidentResolutionOptions,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const INCIDENT_TYPE_LABEL: Record<string, string> = {
  WASH_BAY_FAILURE: "Sự cố wash bay",
  STAFF_UNAVAILABLE: "Nhân viên không sẵn sàng",
  OTHER_GARAGE_INCIDENT: "Sự cố khác tại garage",
};

const DECISION_CARDS: Array<{
  id: BookingIncidentDecision;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tone: "primary" | "warning" | "danger";
  needsNewStartTime?: boolean;
  optionalDecision?: boolean;
}> = [
  {
    id: "REASSIGN_AND_CONTINUE",
    title: "Tiếp tục rửa xe",
    description: "Garage sắp xếp nhân lực / wash bay khác để tiếp tục dịch vụ.",
    icon: Wrench,
    tone: "primary",
  },
  {
    id: "RESCHEDULE_NEAREST",
    title: "Đặt lại khung giờ gần nhất",
    description: "Garage đề xuất khung giờ trống gần nhất cho bạn chọn.",
    icon: Calendar,
    tone: "warning",
  },
  {
    id: "RESCHEDULE_CUSTOM",
    title: "Đặt lại giờ khác",
    description: "Bạn tự chọn khung giờ mới phù hợp với lịch trình của mình.",
    icon: RefreshCcw,
    tone: "warning",
    needsNewStartTime: true,
  },
  {
    id: "CANCEL_BY_GARAGE",
    title: "Huỷ lịch & hoàn tiền",
    description:
      "Huỷ lịch hẹn này. Garage sẽ hoàn tiền hoặc phát voucher bồi thường.",
    icon: X,
    tone: "danger",
  },
];

export default function IncidentDecisionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const bookingId = params.id;
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [data, setData] = useState<BookingIncidentActiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDecision, setSelectedDecision] =
    useState<BookingIncidentDecision | null>(null);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [customStartTime, setCustomStartTime] = useState("");
  const [continuationPolicy, setContinuationPolicy] = useState<
    "RESUME_REMAINING" | "RESTART_CURRENT_ITEM" | ""
  >("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadIncident = useCallback(
    async (silent = false) => {
      if (!accessToken || !bookingId) return;

      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const response = await api.getMyActiveBookingIncident(
          accessToken,
          bookingId
        );
        setData(response.data ?? null);
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status !== 404) {
            Alert.alert("Lỗi", error.message);
          }
        } else {
          Alert.alert("Lỗi", "Không thể tải thông tin sự cố.");
        }
        setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, bookingId]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated && bookingId) {
      void loadIncident();
    }
  }, [isHydrated, isAuthenticated, bookingId, loadIncident]);

  const handleSubmit = async () => {
    if (!accessToken || !data?.incident) return;
    if (!selectedDecision) {
      Alert.alert("Thiếu lựa chọn", "Vui lòng chọn một phương án xử lý.");
      return;
    }

    let newStartTime: string | undefined;
    if (selectedDecision === "RESCHEDULE_CUSTOM") {
      if (!customStartTime.trim()) {
        Alert.alert(
          "Thiếu thời gian",
          "Vui lòng nhập khung giờ mới bạn mong muốn."
        );
        return;
      }
      try {
        const isoCandidate = new Date(customStartTime.trim());
        if (Number.isNaN(isoCandidate.getTime())) {
          throw new Error();
        }
        newStartTime = isoCandidate.toISOString();
      } catch {
        Alert.alert(
          "Sai định dạng",
          "Vui lòng nhập thời gian theo định dạng ISO (ví dụ 2026-07-25T09:00:00.000Z)."
        );
        return;
      }
    } else if (selectedDecision === "RESCHEDULE_NEAREST") {
      if (!selectedSlotIso) {
        Alert.alert(
          "Thiếu khung giờ",
          "Vui lòng chọn một khung giờ trong danh sách gợi ý."
        );
        return;
      }
      newStartTime = selectedSlotIso;
    }

    setSubmitting(true);
    try {
      await api.resolveMyBookingIncident(
        accessToken,
        bookingId,
        data.incident.id,
        {
          decision: selectedDecision as
            | "REASSIGN_AND_CONTINUE"
            | "RESCHEDULE_NEAREST"
            | "RESCHEDULE_CUSTOM"
            | "CANCEL_BY_GARAGE",
          new_start_time: newStartTime,
          continuation_policy: continuationPolicy || undefined,
          customer_note: customerNote.trim() || undefined,
        }
      );
      Alert.alert(
        "Đã gửi quyết định",
        "Garage đã nhận được lựa chọn của bạn và sẽ cập nhật lịch hẹn."
      );
      router.back();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể gửi quyết định. Vui lòng thử lại.";
      Alert.alert("Lỗi", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải thông tin sự cố"
          description="Vui lòng chờ trong giây lát."
        />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Phiên đăng nhập đã hết"
          description="Vui lòng đăng nhập để tiếp tục."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (!data?.incident) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="px-4 pt-3 pb-4 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-primary">Xử lý sự cố</Text>
        </View>
        <ScreenState
          icon={<Check size={28} color="#15803d" strokeWidth={2.4} />}
          title="Không có sự cố đang chờ"
          description="Lịch hẹn của bạn đang diễn ra bình thường."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const incident: BookingIncident = data.incident;
  const options: IncidentResolutionOptions | null | undefined =
    data.resolution_options;
  const availableActions = new Set(options?.available_actions ?? []);
  const decisionCards = DECISION_CARDS.filter((card) =>
    availableActions.has(card.id)
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="px-4 pt-3 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-primary">Xử lý sự cố</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Mã lịch: {bookingId.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadIncident(true)}
          />
        }
      >
        {/* Banner */}
        <View className="px-4 mb-4">
          <View
            className="rounded-2xl p-5 border-2"
            style={{ backgroundColor: "#fee2e2", borderColor: "#b91c1c" }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <AlertTriangle size={22} color="#b91c1c" strokeWidth={2.4} />
              <Text className="text-base font-bold text-red-700">
                Garage gặp sự cố với lịch hẹn của bạn
              </Text>
            </View>
            <Text className="text-sm text-foreground leading-5 mb-1">
              {INCIDENT_TYPE_LABEL[incident.incident_type] ??
                "Sự cố tại garage"}
            </Text>
            {incident.description ? (
              <Text className="text-sm text-muted-foreground leading-5 mt-1">
                {incident.description}
              </Text>
            ) : null}
            {incident.created_at ? (
              <View className="flex-row items-center gap-1 mt-3">
                <Clock4 size={12} color="#b91c1c" strokeWidth={2.2} />
                <Text className="text-xs text-red-700">
                  Ghi nhận lúc {formatDateTime(incident.created_at)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Card chọn phương án */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Bạn muốn xử lý thế nào?
          </Text>

          {decisionCards.length === 0 ? (
            <View className="rounded-xl border border-border bg-card p-4">
              <Text className="text-sm text-muted-foreground">
                Hiện chưa có phương án xử lý phù hợp. Vui lòng liên hệ garage.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {decisionCards.map((card) => {
                const selected = selectedDecision === card.id;
                const Icon = card.icon;
                const borderColor =
                  card.tone === "primary"
                    ? "#1a5fd4"
                    : card.tone === "warning"
                      ? "#a16207"
                      : "#b91c1c";
                const bgColor =
                  card.tone === "primary"
                    ? "#dbe7fb"
                    : card.tone === "warning"
                      ? "#fef3c7"
                      : "#fee2e2";
                const fgColor =
                  card.tone === "primary"
                    ? "#1a5fd4"
                    : card.tone === "warning"
                      ? "#a16207"
                      : "#b91c1c";

                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedDecision(card.id);
                      setSelectedSlotIso(null);
                    }}
                    className={`rounded-2xl border-2 bg-card p-4 ${
                      selected ? "" : "border-border"
                    }`}
                    style={
                      selected
                        ? { borderColor, backgroundColor: "#ffffff" }
                        : undefined
                    }
                  >
                    <View className="flex-row items-start gap-3">
                      <View
                        className="w-11 h-11 rounded-full items-center justify-center"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Icon size={20} color={fgColor} strokeWidth={2.4} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-bold text-foreground">
                            {card.title}
                          </Text>
                          {selected ? (
                            <View
                              className="w-6 h-6 rounded-full items-center justify-center"
                              style={{ backgroundColor: borderColor }}
                            >
                              <Check size={14} color="#ffffff" strokeWidth={3} />
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-xs text-muted-foreground mt-1 leading-5">
                          {card.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Slot picker cho RESCHEDULE_NEAREST */}
        {selectedDecision === "RESCHEDULE_NEAREST" && options ? (
          <View className="px-4 mb-4">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Khung giờ gợi ý
            </Text>
            <View className="rounded-2xl border border-border bg-card p-4 gap-3">
              {(options.days ?? []).map((day) => (
                <View key={day.date}>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Calendar size={14} color="#7a8599" strokeWidth={2.2} />
                    <Text className="text-sm font-semibold text-foreground">
                      {new Date(day.date).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </Text>
                  </View>
                  {day.suggested_slots?.length ? (
                    <View className="flex-row flex-wrap gap-2">
                      {day.suggested_slots.map((slot) => {
                        const selected = selectedSlotIso === slot.start_time;
                        return (
                          <TouchableOpacity
                            key={slot.start_time}
                            activeOpacity={0.85}
                            onPress={() => setSelectedSlotIso(slot.start_time)}
                            disabled={slot.is_available === false}
                            className={`px-3 py-2 rounded-lg border ${
                              selected
                                ? "border-2 border-primary bg-secondary"
                                : "border-border bg-card"
                            }`}
                            style={
                              slot.is_available === false
                                ? { opacity: 0.4 }
                                : undefined
                            }
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                selected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {new Date(slot.start_time).toLocaleTimeString(
                                "vi-VN",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text className="text-xs text-muted-foreground">
                      Không có khung giờ trống trong ngày này.
                    </Text>
                  )}
                </View>
              ))}
              {(options.days ?? []).length === 0 ? (
                <View className="flex-row items-center gap-2">
                  <Hourglass size={16} color="#7a8599" strokeWidth={2.2} />
                  <Text className="text-sm text-muted-foreground">
                    Chưa có khung giờ gợi ý. Vui lòng thử lại sau.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Custom datetime cho RESCHEDULE_CUSTOM */}
        {selectedDecision === "RESCHEDULE_CUSTOM" ? (
          <View className="px-4 mb-4">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Khung giờ mong muốn
            </Text>
            <View className="rounded-2xl border border-border bg-card p-4 gap-3">
              <TextInput
                value={customStartTime}
                onChangeText={setCustomStartTime}
                placeholder="2026-07-25T09:00:00.000Z"
                placeholderTextColor="#94a3b8"
                className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="text-xs text-muted-foreground leading-5">
                Nhập thời gian theo định dạng ISO 8601. Garage sẽ xác nhận lại
                khung giờ này với bạn.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Continuation policy cho REASSIGN_AND_CONTINUE */}
        {selectedDecision === "REASSIGN_AND_CONTINUE" ? (
          <View className="px-4 mb-4">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Chính sách tiếp tục
            </Text>
            <View className="rounded-2xl border border-border bg-card p-4 gap-2">
              <PolicyOption
                selected={continuationPolicy === "RESUME_REMAINING"}
                title="Tiếp tục phần còn lại"
                description="Giữ nguyên tiến độ, chỉ thực hiện phần chưa xong."
                onPress={() => setContinuationPolicy("RESUME_REMAINING")}
              />
              <PolicyOption
                selected={continuationPolicy === "RESTART_CURRENT_ITEM"}
                title="Rửa lại từ đầu"
                description="Bắt đầu lại dịch vụ đang thực hiện từ đầu."
                onPress={() => setContinuationPolicy("RESTART_CURRENT_ITEM")}
              />
            </View>
          </View>
        ) : null}

        {/* Ghi chú */}
        <View className="px-4 mb-4">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Ghi chú cho garage (không bắt buộc)
          </Text>
          <TextInput
            value={customerNote}
            onChangeText={setCustomerNote}
            placeholder="Ví dụ: tôi có thể đến sau 14h..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            maxLength={1000}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground min-h-[80px]"
            textAlignVertical="top"
          />
        </View>

        {/* CTA */}
        <View className="px-4">
          <LoadingButton
            title="Xác nhận quyết định"
            loadingTitle="Đang gửi..."
            loading={submitting}
            disabled={!selectedDecision}
            icon={ArrowRight}
            iconPosition="right"
            onPress={handleSubmit}
          />
          <Text className="text-[11px] text-muted-foreground text-center mt-3 leading-5">
            Sau khi xác nhận, garage sẽ cập nhật lịch hẹn theo lựa chọn của bạn.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicyOption({
  selected,
  title,
  description,
  onPress,
}: {
  selected: boolean;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className={`flex-row items-start gap-3 rounded-xl border-2 p-3 ${
        selected ? "border-primary bg-secondary" : "border-border bg-card"
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full items-center justify-center mt-0.5 ${
          selected ? "bg-primary" : "border border-border bg-background"
        }`}
      >
        {selected ? <Check size={12} color="#ffffff" strokeWidth={3} /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
