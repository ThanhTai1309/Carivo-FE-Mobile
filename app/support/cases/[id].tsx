import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
  ArrowLeft,
  CalendarClock,
  CircleCheck,
  CircleX,
  Clock4,
  Coins,
  Gift,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Paperclip,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  Wrench,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import TextInputDialog from "@/components/common/TextInputDialog";
import { api, ApiError } from "@/lib/api";
import { compactName, formatDateTime, formatCurrency } from "@/lib/format";
import type {
  CustomerCase,
  CustomerCaseDetailResponse,
  CustomerCaseMessage,
  CustomerCaseResolution,
  CustomerCaseStatus,
  CustomerCaseUpload,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED: { label: "Vừa gửi", color: "#1a5fd4", bg: "#dbe7fb" },
  ACKNOWLEDGED: { label: "Đã tiếp nhận", color: "#7c3aed", bg: "#ede9fe" },
  INVESTIGATING: { label: "Đang xử lý", color: "#a16207", bg: "#fef3c7" },
  RESOLVED: { label: "Đã giải quyết", color: "#15803d", bg: "#dcfce7" },
  CLOSED: { label: "Đã đóng", color: "#475569", bg: "#f1f5f9" },
};

const CATEGORY_LABEL: Record<string, string> = {
  VEHICLE_DAMAGE: "Hư hỏng xe",
  MISSING_PROPERTY: "Thiếu đồ",
  SERVICE_QUALITY: "Chất lượng dịch vụ",
  SERVICE_INCOMPLETE: "Dịch vụ chưa hoàn tất",
  BILLING_PAYMENT: "Thanh toán",
  STAFF_CONDUCT: "Thái độ nhân viên",
  SAFETY_CONCERN: "An toàn",
  OTHER: "Khác",
};

const ACTION_LABEL: Record<string, string> = {
  REFUND: "Hoàn tiền",
  VOUCHER: "Voucher bù",
  REWORK: "Làm lại miễn phí",
  WAIVE_CHARGE: "Miễn phí dịch vụ",
  NO_COMPENSATION: "Không bồi thường",
};

function CaseDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const caseId = params.id;
  const { accessToken, isAuthenticated, isHydrated, uploadImage } = useApp();

  const [data, setData] = useState<CustomerCaseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [draftMessage, setDraftMessage] = useState("");
  const [pendingUploads, setPendingUploads] = useState<CustomerCaseUpload[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [respondNote, setRespondNote] = useState("");
  const [respondBusy, setRespondBusy] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);
  const [reopenDialog, setReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const scrollRef = useRef<ScrollView | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!accessToken || !caseId) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const response = await api.getCustomerCaseDetail(accessToken, caseId);
        setData(response.data);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải chi tiết yêu cầu.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, caseId]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated && caseId) void load();
  }, [isHydrated, isAuthenticated, caseId, load]);

  const handleSendMessage = async () => {
    if (!accessToken || !caseId) return;
    const trimmed = draftMessage.trim();
    if (!trimmed && pendingUploads.length === 0) return;
    setSendingMessage(true);
    try {
      await api.postCaseMessage(accessToken, caseId, {
        message: trimmed,
        upload_ids: pendingUploads.map((u) => u.id),
      });
      setDraftMessage("");
      setPendingUploads([]);
      await load(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể gửi tin nhắn.";
      Alert.alert("Lỗi", message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddEvidence = async () => {
    try {
      const picker = await import("expo-image-picker");
      const { status } = await picker.requestMediaLibraryPermissionsAsync();
      if (!status) {
        Alert.alert("Cần quyền truy cập ảnh");
        return;
      }
      const result = await picker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.7,
        selectionLimit: 5,
      });
      if (result.canceled || result.assets.length === 0) return;
      if (!accessToken) return;

      const uploaded: { id: string }[] = [];
      for (const asset of result.assets) {
        const up = await uploadImage(
          asset.uri,
          asset.mimeType ?? "image/jpeg",
          "USER_AVATAR"
        );
        uploaded.push(up);
      }
      await api.addCaseEvidence(
        accessToken,
        caseId,
        uploaded.map((u) => u.id)
      );
      await load(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể tải ảnh lên.";
      Alert.alert("Lỗi", message);
    }
  };

  const handleRespond = async (resolution: CustomerCaseResolution, accept: boolean) => {
    if (!accessToken || !caseId) return;
    setRespondBusy(true);
    try {
      await api.respondCaseResolution(accessToken, caseId, {
        resolution_id: resolution.id,
        accepted: accept,
        note: respondNote.trim() || undefined,
      });
      setRespondNote("");
      await load(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể phản hồi.";
      Alert.alert("Lỗi", message);
    } finally {
      setRespondBusy(false);
    }
  };

  const handleReopen = () => {
    setReopenReason("");
    setReopenDialog(true);
  };

  const submitReopen = async () => {
    if (!accessToken || !caseId) return;
    if (reopenReason.trim().length < 10) return;
    setReopenBusy(true);
    try {
      await api.reopenCase(accessToken, caseId, reopenReason.trim());
      setReopenDialog(false);
      await load(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể mở lại yêu cầu.";
      Alert.alert("Lỗi", message);
    } finally {
      setReopenBusy(false);
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

  if (!data) {
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
          description="Yêu cầu này không còn tồn tại."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const c = data.case;
  const statusStyle = STATUS_LABEL[c.status] ?? STATUS_LABEL.SUBMITTED;
  const categoryLabel = CATEGORY_LABEL[c.category] ?? c.category;
  const pendingResolution = data.resolutions.find(
    (r) => r.status === "PROPOSED"
  );
  const latestResolution = data.resolutions[0];

  const canSendMessage =
    !["RESOLVED", "CLOSED"].includes(c.status) && !sendingMessage;
  const canReopen = c.status === "RESOLVED" || c.status === "CLOSED";

  const messageNodes = [
    ...((data.messages ?? []) as CustomerCaseMessage[]),
  ].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

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
            Yêu cầu #{c.case_code ?? c.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {categoryLabel}
          </Text>
        </View>
        <View
          style={{ backgroundColor: statusStyle.bg }}
          className="px-2 py-1 rounded-full"
        >
          <Text
            style={{ color: statusStyle.color }}
            className="text-[10px] font-bold"
          >
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
            />
          }
        >
          <View className="px-4 gap-3">
            {/* Summary */}
            <View className="rounded-2xl bg-card border border-border p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Info size={14} color="#1a5fd4" strokeWidth={2.2} />
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mô tả
                </Text>
              </View>
              <Text className="text-sm text-foreground leading-6">
                {c.description || "(Không có mô tả)"}
              </Text>
              <View className="flex-row items-center gap-1 mt-3">
                <CalendarClock size={12} color="#7a8599" strokeWidth={2.2} />
                <Text className="text-xs text-muted-foreground">
                  Tạo lúc {formatDateTime(c.created_at)}
                </Text>
              </View>
              {c.assigned_to ? (
                <View className="flex-row items-center gap-1 mt-1">
                  <UserRound size={12} color="#7a8599" strokeWidth={2.2} />
                  <Text className="text-xs text-muted-foreground">
                    Đang xử lý: {compactName(c.assigned_to.full_name, "CSKH")}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Evidence */}
            {(c.evidence?.length ?? 0) > 0 ? (
              <View className="rounded-2xl bg-card border border-border p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <ImageIcon size={14} color="#1a5fd4" strokeWidth={2.2} />
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Hình ảnh / bằng chứng
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {c.evidence?.map((e) => (
                    <View
                      key={e.id}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-secondary"
                    >
                      {e.url ? (
                        <Image
                          source={{ uri: e.url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <ImageIcon size={20} color="#94a3b8" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Add evidence */}
            {["SUBMITTED", "ACKNOWLEDGED", "INVESTIGATING"].includes(c.status) ? (
              <TouchableOpacity
                onPress={handleAddEvidence}
                activeOpacity={0.85}
                className="rounded-2xl border border-dashed border-border bg-card p-4 flex-row items-center gap-3"
              >
                <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center">
                  <Paperclip size={16} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Thêm bằng chứng / ảnh mới
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    Hỗ trợ xử lý nhanh hơn
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Resolution panel */}
            {pendingResolution ? (
              <ResolutionPanel
                resolution={pendingResolution}
                respondNote={respondNote}
                onChangeNote={setRespondNote}
                onAccept={() => handleRespond(pendingResolution, true)}
                onReject={() => handleRespond(pendingResolution, false)}
                busy={respondBusy}
              />
            ) : null}

            {/* Show latest resolution summary if not pending */}
            {!pendingResolution && latestResolution ? (
              <View className="rounded-2xl bg-card border border-border p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Gift size={14} color="#1a5fd4" strokeWidth={2.2} />
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phương án xử lý
                  </Text>
                </View>
                <Text className="text-sm text-foreground font-semibold">
                  {latestResolution.summary}
                </Text>
                <View className="flex-row flex-wrap gap-2 mt-3">
                  {latestResolution.actions.map((a, idx) => (
                    <View
                      key={a.id ?? idx}
                      className="rounded-full bg-secondary px-3 py-1.5"
                    >
                      <Text className="text-xs text-foreground">
                        {ACTION_LABEL[a.action_type] ?? a.action_type}
                      </Text>
                    </View>
                  ))}
                </View>
                <View
                  className="mt-3 rounded-xl p-3"
                  style={{
                    backgroundColor:
                      latestResolution.status === "CUSTOMER_ACCEPTED" ||
                      latestResolution.status === "APPLIED"
                        ? "#dcfce7"
                        : latestResolution.status === "CUSTOMER_REJECTED"
                        ? "#fee2e2"
                        : "#f1f5f9",
                  }}
                >
                  <Text className="text-xs font-semibold">
                    Trạng thái: {latestResolution.status}
                  </Text>
                  {latestResolution.customer_response_note ? (
                    <Text className="text-xs mt-1">
                      Phản hồi: {latestResolution.customer_response_note}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Conclusion */}
            {c.resolution_summary || c.conclusion ? (
              <View className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <ShieldCheck size={14} color="#15803d" strokeWidth={2.2} />
                  <Text className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Kết luận cuối
                  </Text>
                </View>
                {c.resolution_summary ? (
                  <Text className="text-sm text-foreground">
                    {c.resolution_summary}
                  </Text>
                ) : null}
                {c.conclusion ? (
                  <Text className="text-xs text-muted-foreground mt-1">
                    {c.conclusion}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Reopen */}
            {canReopen ? (
              <LoadingButton
                title="Yêu cầu mở lại"
                onPress={handleReopen}
                loading={reopenBusy}
                variant="secondary"
                icon={RefreshCcw}
              />
            ) : null}

            {/* Refunds */}
            {data.refunds && data.refunds.length > 0 ? (
              <View className="rounded-2xl bg-card border border-border p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Coins size={14} color="#1a5fd4" strokeWidth={2.2} />
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Hoàn tiền
                  </Text>
                </View>
                <View className="gap-2">
                  {data.refunds.map((r) => (
                    <View
                      key={r.id}
                      className="flex-row items-center justify-between"
                    >
                      <View>
                        <Text className="text-sm font-semibold text-foreground">
                          {formatCurrency(r.amount)}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          {r.method}
                        </Text>
                      </View>
                      <Text className="text-xs font-bold text-primary">
                        {r.status}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Messages */}
            <View className="rounded-2xl bg-card border border-border p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <MessageSquare size={14} color="#1a5fd4" strokeWidth={2.2} />
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Hội thoại
                </Text>
              </View>
              {messageNodes.length === 0 ? (
                <Text className="text-xs text-muted-foreground italic">
                  Chưa có tin nhắn nào.
                </Text>
              ) : (
                <View className="gap-2.5">
                  {messageNodes.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                </View>
              )}
            </View>

            {/* Timeline */}
            {data.timeline && data.timeline.length > 0 ? (
              <View className="rounded-2xl bg-card border border-border p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Clock4 size={14} color="#1a5fd4" strokeWidth={2.2} />
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Lịch sử
                  </Text>
                </View>
                <View className="gap-3">
                  {data.timeline.map((e) => (
                    <View key={e.id} className="flex-row items-start gap-2">
                      <View className="w-7 h-7 rounded-full bg-secondary items-center justify-center mt-0.5">
                        <Clock4 size={12} color="#1a5fd4" strokeWidth={2.2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-foreground">
                          {e.event_type}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDateTime(e.created_at)}
                          {e.actor?.full_name
                            ? ` • ${compactName(e.actor.full_name)}`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Pending upload preview */}
        {pendingUploads.length > 0 ? (
          <View className="px-4 pb-2 flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-lg bg-secondary items-center justify-center">
              <ImageIcon size={14} color="#1a5fd4" strokeWidth={2.2} />
            </View>
            <Text className="text-xs text-muted-foreground">
              {pendingUploads.length} ảnh đính kèm
            </Text>
          </View>
        ) : null}

        {/* Composer */}
        {canSendMessage ? (
          <View
            className="px-4 py-3 bg-card border-t border-border"
            style={{ paddingBottom: 12 }}
          >
            <View className="flex-row items-end gap-2">
              <TouchableOpacity
                onPress={handleAddEvidence}
                className="w-10 h-10 rounded-full bg-secondary items-center justify-center"
              >
                <Paperclip size={16} color="#1a5fd4" strokeWidth={2.2} />
              </TouchableOpacity>
              <View className="flex-1 rounded-2xl border border-border bg-input px-3 py-2">
                <TextInput
                  value={draftMessage}
                  onChangeText={setDraftMessage}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  maxLength={1000}
                  className="text-foreground max-h-24"
                />
              </View>
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={sendingMessage}
                activeOpacity={0.85}
                className="w-10 h-10 rounded-full bg-primary items-center justify-center"
              >
                {sendingMessage ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Send size={16} color="#ffffff" strokeWidth={2.4} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <TextInputDialog
        visible={reopenDialog}
        title="Mở lại yêu cầu"
        description="Cho Carivo biết lý do bạn muốn mở lại yêu cầu này (tối thiểu 10 ký tự)."
        placeholder="Ví dụ: Vẫn còn vết xước sau khi garage xử lý..."
        value={reopenReason}
        onChangeText={setReopenReason}
        confirmLabel="Gửi yêu cầu"
        onConfirm={submitReopen}
        onCancel={() => setReopenDialog(false)}
        loading={reopenBusy}
        minLength={10}
      />
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: CustomerCaseMessage }) {
  const isCustomer = message.sender_role === "CUSTOMER";
  return (
    <View
      className={`flex-row ${isCustomer ? "justify-end" : "justify-start"}`}
    >
      <View
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          isCustomer ? "bg-primary" : "bg-secondary"
        }`}
      >
        <Text
          className={`text-[10px] font-semibold mb-1 ${
            isCustomer ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {message.sender?.full_name ??
            (isCustomer ? "Bạn" : "Carivo")}
        </Text>
        {message.message ? (
          <Text
            className={`text-sm ${isCustomer ? "text-white" : "text-foreground"}`}
          >
            {message.message}
          </Text>
        ) : null}
        {message.evidence && message.evidence.length > 0 ? (
          <View className="flex-row flex-wrap gap-1 mt-1.5">
            {message.evidence.map((e) =>
              e.url ? (
                <Image
                  key={e.id}
                  source={{ uri: e.url }}
                  className="w-16 h-16 rounded-lg"
                  resizeMode="cover"
                />
              ) : null
            )}
          </View>
        ) : null}
        <Text
          className={`text-[10px] mt-1 ${
            isCustomer ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {formatDateTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

function ResolutionPanel({
  resolution,
  respondNote,
  onChangeNote,
  onAccept,
  onReject,
  busy,
}: {
  resolution: CustomerCaseResolution;
  respondNote: string;
  onChangeNote: (v: string) => void;
  onAccept: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <View className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <Sparkles size={14} color="#a16207" strokeWidth={2.2} />
        <Text className="text-xs font-bold text-amber-800 uppercase tracking-wider">
          Phương án đề xuất
        </Text>
      </View>
      <Text className="text-sm text-foreground font-semibold">
        {resolution.summary}
      </Text>
      <View className="flex-row flex-wrap gap-2 mt-3">
        {resolution.actions.map((a, idx) => (
          <View
            key={a.id ?? idx}
            className="rounded-full bg-white px-3 py-1.5"
          >
            <Text className="text-xs text-foreground">
              {ACTION_LABEL[a.action_type] ?? a.action_type}
              {a.amount ? ` • ${formatCurrency(a.amount)}` : ""}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-3 rounded-xl bg-white border border-amber-200 p-3">
        <Text className="text-xs font-semibold text-amber-800 mb-1.5">
          Ghi chú phản hồi (tuỳ chọn)
        </Text>
        <TextInput
          value={respondNote}
          onChangeText={onChangeNote}
          placeholder="Lý do đồng ý / từ chối..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
          className="text-foreground min-h-[60px]"
        />
      </View>

      <View className="flex-row gap-2 mt-3">
        <LoadingButton
          title="Từ chối"
          onPress={onReject}
          loading={busy}
          variant="secondary"
          icon={CircleX}
          fullWidth={false}
        />
        <LoadingButton
          title="Chấp nhận"
          onPress={onAccept}
          loading={busy}
          icon={CircleCheck}
          fullWidth={false}
        />
      </View>
    </View>
  );
}

export default function CaseDetailScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi chi tiết yêu cầu">
      <CaseDetailScreen />
    </ErrorBoundary>
  );
}
