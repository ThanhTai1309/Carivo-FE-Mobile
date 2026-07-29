import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileQuestion } from "lucide-react-native";
import LoadingButton from "@/components/common/LoadingButton";
import { api, ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";

export default function BookingViolationAppealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId?: string;
    eventLabel?: string;
    bookingCode?: string;
  }>();
  const { accessToken } = useApp();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const normalizedReason = reason.trim();

    if (!accessToken || !params.eventId) {
      Alert.alert("Không thể gửi", "Không tìm thấy sự kiện điểm vi phạm.");
      return;
    }

    if (normalizedReason.length < 10) {
      Alert.alert(
        "Lý do chưa đầy đủ",
        "Vui lòng mô tả lý do khiếu nại với ít nhất 10 ký tự."
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.createBookingViolationAppeal(accessToken, {
        event_id: params.eventId,
        reason: normalizedReason,
      });
      Alert.alert(
        "Đã gửi khiếu nại",
        "Admin sẽ xem xét và thông báo kết quả cho bạn.",
        [{ text: "Đóng", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        "Không thể gửi khiếu nại",
        error instanceof ApiError
          ? error.message
          : "Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <ArrowLeft size={20} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              Khiếu nại điểm vi phạm
            </Text>
            <Text className="text-xs text-muted-foreground">
              Mỗi sự kiện chỉ được gửi một lần
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="rounded-3xl bg-blue-50 p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
                <FileQuestion size={22} color="#1d4ed8" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-blue-900">
                  {params.eventLabel || "Sự kiện điểm vi phạm"}
                </Text>
                {params.bookingCode ? (
                  <Text className="mt-1 text-xs text-blue-700">
                    Booking {params.bookingCode}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View className="mt-5 rounded-3xl bg-card p-5">
            <Text className="text-base font-bold text-foreground">
              Lý do khiếu nại
            </Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Nêu rõ tình huống, thời điểm và căn cứ để Admin có thể kiểm tra.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Ví dụ: Garage đã xác nhận hủy do hệ thống gặp lỗi..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
              textAlignVertical="top"
              className="mt-4 min-h-40 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
            <Text className="mt-2 text-right text-xs text-muted-foreground">
              {reason.length}/1000
            </Text>
          </View>

          <View className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Text className="text-sm font-semibold text-amber-900">
              Lưu ý
            </Text>
            <Text className="mt-1 text-sm leading-5 text-amber-800">
              Nếu được chấp nhận, số điểm của sự kiện sẽ được hoàn lại và thời
              gian khóa có thể được gỡ khi điểm giảm dưới ngưỡng.
            </Text>
          </View>

          <LoadingButton
            title="Gửi khiếu nại"
            loading={submitting}
            disabled={submitting || reason.trim().length < 10}
            onPress={() => void submit()}
            className="mt-6"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
