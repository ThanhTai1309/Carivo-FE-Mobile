import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock4,
  Hourglass,
  ImageIcon,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { BookingHandover, BookingHandoverState } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const STATE_COPY: Record<
  BookingHandoverState,
  { title: string; tone: "info" | "warning" | "success" | "danger" }
> = {
  PENDING: { title: "Chờ garage chuẩn bị", tone: "info" },
  READY_FOR_CUSTOMER: { title: "Sẵn sàng bàn giao", tone: "warning" },
  ON_HOLD: { title: "Tạm giữ - đang xử lý sự cố", tone: "danger" },
  RELEASED: { title: "Đã hoàn tất bàn giao", tone: "success" },
};

const TONE_BG: Record<"info" | "warning" | "success" | "danger", string> = {
  info: "#dbe7fb",
  warning: "#fef3c7",
  success: "#dcfce7",
  danger: "#fee2e2",
};
const TONE_FG: Record<"info" | "warning" | "success" | "danger", string> = {
  info: "#1a5fd4",
  warning: "#a16207",
  success: "#15803d",
  danger: "#b91c1c",
};

export default function HandoverDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const bookingId = params.id;
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [handover, setHandover] = useState<BookingHandover | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptNote, setAcceptNote] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<
    { uri: string; title: string } | null
  >(null);

  const loadHandover = useCallback(
    async (silent = false) => {
      if (!accessToken || !bookingId) return;

      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const response = await api.getMyHandover(accessToken, bookingId);
        setHandover(response.data);
      } catch (error) {
        if (error instanceof ApiError) {
          // 404 = chưa sẵn sàng bàn giao, coi như chưa có dữ liệu
          if (error.status !== 404) {
            Alert.alert("Lỗi", error.message);
          }
        } else {
          Alert.alert("Lỗi", "Không thể tải thông tin bàn giao.");
        }
        setHandover(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, bookingId]
  );

  useEffect(() => {
    if (isHydrated && isAuthenticated && bookingId) {
      void loadHandover();
    }
  }, [isHydrated, isAuthenticated, bookingId, loadHandover]);

  const handleAccept = async () => {
    if (!accessToken || !handover) return;
    setAccepting(true);
    try {
      const response = await api.acceptMyHandover(
        accessToken,
        handover.booking_id,
        acceptNote.trim() || undefined
      );
      setHandover(response.data);
      setShowAcceptModal(false);
      setAcceptNote("");
      Alert.alert(
        "Đã xác nhận",
        "Cảm ơn bạn đã xác nhận nhận xe. Garage sẽ hoàn tất thủ tục thanh toán."
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể xác nhận nhận xe.";
      Alert.alert("Lỗi", message);
    } finally {
      setAccepting(false);
    }
  };

  const handleReport = async () => {
    if (!accessToken || !handover) return;
    const trimmed = reportDescription.trim();
    if (trimmed.length < 10) {
      Alert.alert(
        "Thiếu mô tả",
        "Vui lòng mô tả sự cố ít nhất 10 ký tự để garage xử lý."
      );
      return;
    }

    setReporting(true);
    try {
      await api.reportHandoverIssue(accessToken, handover.booking_id, {
        category: "HANDOVER_ISSUE",
        description: trimmed,
        vehicle_received: false,
        upload_ids: [],
      });
      setShowReportModal(false);
      setReportDescription("");
      Alert.alert(
        "Đã gửi báo cáo",
        "Garage đã nhận được báo cáo và sẽ liên hệ với bạn."
      );
      await loadHandover(true);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể gửi báo cáo sự cố.";
      Alert.alert("Lỗi", message);
    } finally {
      setReporting(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải thông tin bàn giao"
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
          description="Vui lòng đăng nhập để xem chi tiết."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (!handover) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="px-4 pt-3 pb-4 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-primary">Bàn giao xe</Text>
        </View>
        <ScreenState
          icon={<Hourglass size={28} color="#1a5fd4" strokeWidth={2} />}
          title="Chưa sẵn sàng bàn giao"
          description={
            "Garage đang hoàn tất kiểm tra xe. Bạn sẽ nhận được thông báo khi xe sẵn sàng để nhận."
          }
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const stateCopy = STATE_COPY[handover.state] ?? STATE_COPY.PENDING;
  const inspectionSnapshot = handover.inspection_snapshot;

  const extractImages = (key: "before" | "after"): string[] => {
    if (!inspectionSnapshot || typeof inspectionSnapshot !== "object") return [];
    const snapshot = inspectionSnapshot as Record<string, unknown>;
    const block = snapshot[key];
    if (!block || typeof block !== "object") return [];
    const images = (block as { images?: unknown }).images;
    if (!Array.isArray(images)) return [];
    return images.filter((u): u is string => typeof u === "string");
  };

  const beforeImages = extractImages("before");
  const afterImages = extractImages("after");

  const canAccept =
    handover.state === "READY_FOR_CUSTOMER" &&
    handover.customer_response !== "ACCEPTED";
  const isAccepted = handover.customer_response === "ACCEPTED";
  const isReleased = handover.state === "RELEASED";

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
            <Text className="text-lg font-bold text-primary">Bàn giao xe</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Mã lịch: {bookingId.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
        <View
          className="px-3 py-1.5 rounded-full"
          style={{ backgroundColor: TONE_BG[stateCopy.tone] }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: TONE_FG[stateCopy.tone] }}
          >
            {stateCopy.title}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHandover(true)}
          />
        }
      >
        {/* Banner lớn */}
        <View className="px-4 mb-4">
          {handover.state === "READY_FOR_CUSTOMER" && !isAccepted ? (
            <View
              className="rounded-2xl p-5 border-2"
              style={{
                backgroundColor: "#dbe7fb",
                borderColor: "#1a5fd4",
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <Truck size={22} color="#1a5fd4" strokeWidth={2.4} />
                <Text className="text-base font-bold text-primary">
                  Xe của bạn đã sẵn sàng
                </Text>
              </View>
              <Text className="text-sm text-foreground leading-5 mb-1">
                Garage đã hoàn tất rửa xe và kiểm tra. Vui lòng đến garage để
                nhận xe và xác nhận bàn giao.
              </Text>
              {handover.ready_at ? (
                <View className="flex-row items-center gap-1 mt-2">
                  <Clock4 size={12} color="#1a5fd4" strokeWidth={2.2} />
                  <Text className="text-xs text-primary">
                    Sẵn sàng từ {formatDateTime(handover.ready_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {isAccepted && !isReleased ? (
            <View
              className="rounded-2xl p-5 border-2"
              style={{
                backgroundColor: "#dcfce7",
                borderColor: "#15803d",
              }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <CheckCircle2 size={22} color="#15803d" strokeWidth={2.4} />
                <Text className="text-base font-bold text-emerald-700">
                  Đã xác nhận nhận xe
                </Text>
              </View>
              <Text className="text-sm text-foreground leading-5">
                Bạn đã xác nhận nhận xe thành công. Garage sẽ hoàn tất thủ tục
                thanh toán.
              </Text>
              {handover.accepted_at ? (
                <Text className="text-xs text-muted-foreground mt-2">
                  Xác nhận lúc {formatDateTime(handover.accepted_at)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {handover.state === "ON_HOLD" ? (
            <View
              className="rounded-2xl p-5 border-2"
              style={{ backgroundColor: "#fee2e2", borderColor: "#b91c1c" }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <AlertTriangle size={22} color="#b91c1c" strokeWidth={2.4} />
                <Text className="text-base font-bold text-red-700">
                  Tạm giữ xe - đang xử lý sự cố
                </Text>
              </View>
              <Text className="text-sm text-foreground leading-5">
                Đã có báo cáo sự cố trong quá trình rửa xe. Garage sẽ liên hệ
                với bạn để xử lý.
              </Text>
            </View>
          ) : null}

          {isReleased ? (
            <View
              className="rounded-2xl p-5 border-2"
              style={{ backgroundColor: "#dcfce7", borderColor: "#15803d" }}
            >
              <View className="flex-row items-center gap-2 mb-2">
                <CheckCircle2 size={22} color="#15803d" strokeWidth={2.4} />
                <Text className="text-base font-bold text-emerald-700">
                  Đã hoàn tất bàn giao
                </Text>
              </View>
              <Text className="text-sm text-foreground leading-5">
                Xe đã được bàn giao thành công. Cảm ơn bạn đã sử dụng Carivo.
              </Text>
              {handover.released_at ? (
                <Text className="text-xs text-muted-foreground mt-2">
                  Hoàn tất lúc {formatDateTime(handover.released_at)}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Trạng thái */}
        <View className="px-4 mb-4">
          <View className="rounded-2xl bg-card border border-border p-4">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Thông tin bàn giao
            </Text>

            <View className="gap-3">
              {handover.ready_by ? (
                <View className="flex-row items-start gap-3">
                  <ShieldCheck
                    size={18}
                    color="#1a5fd4"
                    strokeWidth={2.4}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">
                      Garage chuẩn bị
                    </Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {handover.ready_by.full_name ?? "Staff"}
                    </Text>
                    {handover.ready_at ? (
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(handover.ready_at)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {handover.released_by ? (
                <View className="flex-row items-start gap-3">
                  <CheckCircle2
                    size={18}
                    color="#15803d"
                    strokeWidth={2.4}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">
                      Garage bàn giao
                    </Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {handover.released_by.full_name ?? "Staff"}
                    </Text>
                    {handover.released_at ? (
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(handover.released_at)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {handover.ready_note ? (
                <View className="flex-row items-start gap-3">
                  <ClipboardList
                    size={18}
                    color="#7a8599"
                    strokeWidth={2.4}
                    style={{ marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">
                      Ghi chú từ garage
                    </Text>
                    <Text className="text-sm text-foreground leading-5">
                      {handover.ready_note}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Ảnh trước/sau */}
        {beforeImages.length > 0 || afterImages.length > 0 ? (
          <View className="px-4 mb-4">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Hình ảnh kiểm tra xe
            </Text>
            <View className="rounded-2xl bg-card border border-border p-4 gap-4">
              {beforeImages.length > 0 ? (
                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Camera size={14} color="#7a8599" strokeWidth={2.4} />
                    <Text className="text-sm font-semibold text-foreground">
                      Trước khi rửa
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      ({beforeImages.length} ảnh)
                    </Text>
                  </View>
                  <ImageGrid
                    images={beforeImages}
                    onPress={(uri) =>
                      setSelectedImageIndex({
                        uri,
                        title: "Trước khi rửa",
                      })
                    }
                  />
                </View>
              ) : null}

              {afterImages.length > 0 ? (
                <View>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Camera size={14} color="#7a8599" strokeWidth={2.4} />
                    <Text className="text-sm font-semibold text-foreground">
                      Sau khi rửa
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      ({afterImages.length} ảnh)
                    </Text>
                  </View>
                  <ImageGrid
                    images={afterImages}
                    onPress={(uri) =>
                      setSelectedImageIndex({ uri, title: "Sau khi rửa" })
                    }
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* CTA buttons */}
        {canAccept ? (
          <View className="px-4 gap-3">
            <LoadingButton
              title="Xác nhận đã nhận xe"
              loadingTitle="Đang xác nhận..."
              loading={accepting}
              icon={CheckCircle2}
              onPress={() => setShowAcceptModal(true)}
              variant="success"
            />
            <LoadingButton
              title="Báo cáo sự cố khi nhận xe"
              loadingTitle="Đang gửi..."
              loading={reporting}
              icon={AlertTriangle}
              onPress={() => setShowReportModal(true)}
              variant="secondary"
            />
          </View>
        ) : null}

        {!canAccept && (isAccepted || isReleased) && handover.released_at ? (
          <View className="px-4">
            <View className="rounded-xl bg-secondary p-3 flex-row items-center gap-2">
              <CheckCircle2 size={16} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="text-xs text-primary flex-1">
                Lịch hẹn này đã hoàn tất.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal xác nhận nhận xe */}
      <Modal
        visible={showAcceptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAcceptModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-card rounded-2xl p-5 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">
                Xác nhận nhận xe
              </Text>
              <TouchableOpacity
                onPress={() => setShowAcceptModal(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <X size={20} color="#7a8599" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-muted-foreground leading-5 mb-4">
              Vui lòng kiểm tra kỹ tình trạng xe trước khi xác nhận. Sau khi xác
              nhận, garage sẽ hoàn tất thủ tục thanh toán.
            </Text>

            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Ghi chú (không bắt buộc)
            </Text>
            <TextInput
              value={acceptNote}
              onChangeText={setAcceptNote}
              multiline
              numberOfLines={3}
              maxLength={1000}
              placeholder="Ví dụ: xe sạch, đầy đủ phụ kiện..."
              placeholderTextColor="#94a3b8"
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground min-h-[80px]"
              textAlignVertical="top"
            />

            <View className="flex-row gap-2 mt-5">
              <TouchableOpacity
                onPress={() => {
                  setShowAcceptModal(false);
                  setAcceptNote("");
                }}
                className="flex-1 rounded-xl border border-border bg-card py-3 items-center"
              >
                <Text className="font-semibold text-foreground">Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAccept}
                disabled={accepting}
                className={`flex-1 rounded-xl bg-emerald-600 py-3 items-center ${
                  accepting ? "opacity-60" : ""
                }`}
              >
                {accepting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-bold text-white">Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal báo cáo sự cố */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-card rounded-2xl p-5 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">
                Báo cáo sự cố
              </Text>
              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <X size={20} color="#7a8599" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-muted-foreground leading-5 mb-4">
              Mô tả chi tiết vấn đề bạn gặp phải. Garage sẽ phản hồi trong thời
              gian sớm nhất.
            </Text>

            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Mô tả sự cố *
            </Text>
            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              multiline
              numberOfLines={5}
              maxLength={2000}
              placeholder="Mô tả chi tiết (tối thiểu 10 ký tự)..."
              placeholderTextColor="#94a3b8"
              className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground min-h-[120px]"
              textAlignVertical="top"
            />
            <Text className="text-xs text-muted-foreground mt-1 self-end">
              {reportDescription.length}/2000
            </Text>

            <View className="flex-row gap-2 mt-5">
              <TouchableOpacity
                onPress={() => {
                  setShowReportModal(false);
                  setReportDescription("");
                }}
                className="flex-1 rounded-xl border border-border bg-card py-3 items-center"
              >
                <Text className="font-semibold text-foreground">Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReport}
                disabled={reporting}
                className={`flex-1 rounded-xl bg-red-600 py-3 items-center ${
                  reporting ? "opacity-60" : ""
                }`}
              >
                {reporting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-bold text-white">Gửi báo cáo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal xem ảnh fullscreen */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-white text-base font-bold">
                {selectedImageIndex?.title ?? ""}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedImageIndex(null)}
                className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
              >
                <X size={20} color="#ffffff" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
            <View className="flex-1 items-center justify-center">
              {selectedImageIndex ? (
                <Image
                  source={{ uri: selectedImageIndex.uri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ImageGrid({
  images,
  onPress,
}: {
  images: string[];
  onPress: (uri: string) => void;
}) {
  if (images.length === 0) {
    return (
      <View className="rounded-xl bg-muted py-4 items-center">
        <ImageIcon size={20} color="#94a3b8" strokeWidth={2.2} />
        <Text className="text-xs text-muted-foreground mt-1">
          Chưa có hình ảnh
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {images.map((uri, idx) => (
        <TouchableOpacity
          key={`${uri}-${idx}`}
          onPress={() => onPress(uri)}
          activeOpacity={0.85}
          className="w-20 h-20 rounded-lg overflow-hidden border border-border"
        >
          <Image
            source={{ uri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
