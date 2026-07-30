import { useState } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react-native";
import { ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";

function PasswordStrength({ password }: { password: string }) {
  const score = Math.min(
    4,
    [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((rx) =>
      rx.test(password)
    ).length
  );
  if (!password) return null;

  const labels = ["Rất yếu", "Yếu", "Trung bình", "Khá", "Mạnh"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

  return (
    <View className="mt-2">
      <View className="flex-row gap-1">
        {[0, 1, 2, 3].map((idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: idx < score ? colors[score] : "#e2e8f0",
              height: 4,
            }}
            className="flex-1 rounded-full"
          />
        ))}
      </View>
      <Text
        style={{ color: colors[score] }}
        className="text-[11px] font-semibold mt-1.5 ml-1"
      >
        Độ mạnh: {labels[score]}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { changePassword, logout } = useApp();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const newPasswordValid = newPassword.length >= 8;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && newPasswordValid && passwordsMatch;

  const handleSubmit = async () => {
    if (!currentPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPasswordValid) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert(
        "Thành công",
        "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.",
        [
          {
            text: "Đăng xuất",
            onPress: async () => {
              await logout();
              router.dismissAll();
              router.replace("/login");
            },
          },
          { text: "Ở lại", style: "cancel", onPress: () => router.back() },
        ]
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể đổi mật khẩu. Vui lòng thử lại.";
      Alert.alert("Lỗi đổi mật khẩu", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-3 pb-4 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-base font-bold text-foreground pr-10">
            Đổi mật khẩu
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero icon */}
          <View className="items-center pt-8 pb-6">
            <View
              className="w-24 h-24 rounded-full bg-secondary items-center justify-center"
              style={{
                shadowColor: "#1a5fd4",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <KeyRound size={42} color="#1a5fd4" strokeWidth={1.8} />
            </View>
            <Text className="text-xl font-bold text-foreground mt-4 text-center px-8">
              Cập nhật mật khẩu của bạn
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-2 px-10 leading-relaxed">
              Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường,
              số và ký tự đặc biệt.
            </Text>
          </View>

          {/* Form */}
          <View className="px-5 gap-5">
            {/* Current password */}
            <View>
              <Text className="text-xs font-semibold text-foreground mb-2 ml-1">
                Mật khẩu hiện tại
              </Text>
              <View className="flex-row items-center rounded-xl border border-border bg-card px-4">
                <KeyRound size={16} color="#7a8599" strokeWidth={2.2} />
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 px-3 py-4 text-foreground"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent((v) => !v)}
                  className="px-1"
                  hitSlop={8}
                >
                  {showCurrent ? (
                    <EyeOff size={18} color="#7a8599" strokeWidth={2.2} />
                  ) : (
                    <Eye size={18} color="#7a8599" strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* New password */}
            <View>
              <Text className="text-xs font-semibold text-foreground mb-2 ml-1">
                Mật khẩu mới
              </Text>
              <View
                className={`flex-row items-center rounded-xl border bg-card px-4 ${
                  newPassword && !newPasswordValid
                    ? "border-red-400"
                    : "border-border"
                }`}
              >
                <KeyRound
                  size={16}
                  color={newPassword && !newPasswordValid ? "#ef4444" : "#7a8599"}
                  strokeWidth={2.2}
                />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="Tối thiểu 8 ký tự"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 px-3 py-4 text-foreground"
                />
                <TouchableOpacity
                  onPress={() => setShowNew((v) => !v)}
                  className="px-1"
                  hitSlop={8}
                >
                  {showNew ? (
                    <EyeOff size={18} color="#7a8599" strokeWidth={2.2} />
                  ) : (
                    <Eye size={18} color="#7a8599" strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
              </View>
              <PasswordStrength password={newPassword} />
            </View>

            {/* Confirm */}
            <View>
              <Text className="text-xs font-semibold text-foreground mb-2 ml-1">
                Xác nhận mật khẩu mới
              </Text>
              <View
                className={`flex-row items-center rounded-xl border bg-card px-4 ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-400"
                    : "border-border"
                }`}
              >
                <ShieldCheck
                  size={16}
                  color={
                    confirmPassword && !passwordsMatch ? "#ef4444" : "#7a8599"
                  }
                  strokeWidth={2.2}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 px-3 py-4 text-foreground"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  className="px-1"
                  hitSlop={8}
                >
                  {showConfirm ? (
                    <EyeOff size={18} color="#7a8599" strokeWidth={2.2} />
                  ) : (
                    <Eye size={18} color="#7a8599" strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
              </View>
              {confirmPassword && !passwordsMatch ? (
                <View className="flex-row items-center gap-1 mt-1.5 ml-1">
                  <ShieldAlert size={12} color="#ef4444" strokeWidth={2.4} />
                  <Text className="text-[11px] font-medium text-red-500">
                    Mật khẩu không khớp
                  </Text>
                </View>
              ) : confirmPassword && passwordsMatch ? (
                <View className="flex-row items-center gap-1 mt-1.5 ml-1">
                  <ShieldCheck size={12} color="#16a34a" strokeWidth={2.4} />
                  <Text className="text-[11px] font-medium text-emerald-600">
                    Mật khẩu khớp
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Security tip card */}
            <View className="flex-row items-start gap-2.5 rounded-xl bg-secondary px-4 py-3 mt-2">
              <ShieldCheck size={16} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="flex-1 text-[11px] text-primary leading-relaxed">
                Sau khi đổi mật khẩu, bạn sẽ được đăng xuất khỏi tất cả thiết bị
                và cần đăng nhập lại để tiếp tục sử dụng Carivo.
              </Text>
            </View>
          </View>

          {/* Submit */}
          <View className="px-5 mt-7">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              activeOpacity={0.85}
              className={`rounded-xl py-4 flex-row items-center justify-center ${
                canSubmit ? "bg-primary" : "bg-muted"
              }`}
              style={
                canSubmit
                  ? {
                      shadowColor: "#1a5fd4",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.28,
                      shadowRadius: 10,
                      elevation: 4,
                    }
                  : undefined
              }
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  className={`font-bold text-base ${
                    canSubmit ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  Đổi mật khẩu
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-4 items-center"
              activeOpacity={0.6}
            >
              <Text className="text-sm font-semibold text-primary">
                Quay lại
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
