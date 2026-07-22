import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Camera, Pencil, ShieldCheck } from "lucide-react-native";
import { ApiError } from "@/lib/api";
import { useApp } from "@/providers/AppProvider";

function maskPhone(phone: string) {
  if (phone.length <= 6) return phone;
  const visibleStart = phone.slice(0, 4);
  const visibleEnd = phone.slice(-2);
  const hidden = "*".repeat(Math.max(phone.length - 6, 2));
  return `${visibleStart}${hidden}${visibleEnd}`;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const {
    authUser,
    profile,
    refreshProfile,
    updateProfile,
    uploadImage,
    requestPhoneVerification,
    verifyPhoneOtp,
  } = useApp();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [originalPhone] = useState(profile?.phone ?? "");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    setFullName(profile?.full_name ?? authUser?.full_name ?? "");
    setEmail(profile?.email ?? authUser?.email ?? "");
    setPhone(profile?.phone ?? authUser?.phone ?? "");
  }, [authUser, profile]);

  const phoneChanged = phone.trim() && phone.trim() !== originalPhone.trim();

  const handleSendOtp = async () => {
    if (!phoneChanged) {
      Alert.alert("Không có thay đổi", "Số điện thoại mới phải khác số hiện tại.");
      return;
    }
    if (!/^\+?\d{9,12}$/.test(phone.trim().replace(/\s/g, ""))) {
      Alert.alert("Số điện thoại không hợp lệ", "Vui lòng kiểm tra lại.");
      return;
    }

    setSendingOtp(true);
    try {
      const challenge = await requestPhoneVerification(phone.trim());
      setChallengeId(challenge.challenge_id);
      setOtpSent(true);
      Alert.alert(
        "Mã OTP đã được gửi",
        challenge.debug_otp
          ? `Mã xác minh (dev): ${challenge.debug_otp}`
          : "Vui lòng kiểm tra điện thoại."
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể gửi mã xác minh.";
      Alert.alert("Lỗi gửi OTP", message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePickAvatar = async () => {
    if (avatarBusy) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Quyền truy cập ảnh",
          "Cần cấp quyền để thay đổi ảnh đại diện."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      setAvatarBusy(true);
      try {
        const uploaded = await uploadImage(asset.uri, asset.mimeType ?? "image/jpeg");
        await updateProfile({ avatar_url: uploaded.url });
        setAvatarVersion((v) => v + 1);
      } finally {
        setAvatarBusy(false);
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể cập nhật ảnh.";
      Alert.alert("Lỗi cập nhật ảnh", message);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("Lỗi", "Họ tên không được để trống.");
      return;
    }
    if (phoneChanged && !otpSent) {
      Alert.alert("Cần xác minh", "Vui lòng gửi và nhập mã OTP cho SĐT mới.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        full_name: fullName.trim(),
        email: email.trim() || null,
      };

      if (phoneChanged) {
        if (!otp || !challengeId) {
          throw new Error("Nhập mã OTP đã gửi tới SĐT mới.");
        }
        const verified = await verifyPhoneOtp(challengeId, otp.trim());
        payload.phone = phone.trim();
        payload.phone_verification_token = verified.verification_token;
      }

      await updateProfile(payload);
      await refreshProfile();
      Alert.alert("Thành công", "Đã cập nhật hồ sơ.");
      router.back();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Không thể cập nhật hồ sơ.";
      Alert.alert("Lỗi cập nhật", message);
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUrl = profile?.avatar_url || authUser?.avatar_url || null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-3 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-base font-bold text-foreground pr-10">
            Chỉnh sửa hồ sơ
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View className="items-center pt-2 pb-5">
            <View className="relative">
              <View
                className="w-28 h-28 rounded-full bg-secondary items-center justify-center overflow-hidden"
                style={{
                  borderWidth: 4,
                  borderColor: "#ffffff",
                  shadowColor: "#1a5fd4",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {avatarUrl ? (
                  <Image
                    key={`${avatarUrl}-${avatarVersion}`}
                    source={{ uri: avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Pencil size={36} color="#1a5fd4" strokeWidth={2} />
                )}
              </View>
              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={avatarBusy}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary items-center justify-center"
                style={{
                  borderWidth: 3,
                  borderColor: "#ffffff",
                }}
              >
                {avatarBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Camera size={16} color="#ffffff" strokeWidth={2.4} />
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-muted-foreground mt-3">
              Nhấn vào camera để đổi ảnh đại diện
            </Text>
          </View>

          {/* Form */}
          <View className="px-4 gap-4">
            <View>
              <Text className="text-xs font-semibold text-muted-foreground mb-1.5 ml-1">
                Họ và tên
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-border bg-card px-4 py-3.5 text-foreground"
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-muted-foreground mb-1.5 ml-1">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-border bg-card px-4 py-3.5 text-foreground"
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-muted-foreground mb-1.5 ml-1">
                Số điện thoại
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    if (otpSent) {
                      setOtpSent(false);
                      setChallengeId(null);
                      setOtp("");
                    }
                  }}
                  keyboardType="phone-pad"
                  placeholder="Số điện thoại"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-3.5 text-foreground"
                />
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={!phoneChanged || sendingOtp}
                  activeOpacity={0.85}
                  className={`rounded-xl px-4 items-center justify-center ${
                    phoneChanged ? "bg-primary" : "bg-muted"
                  }`}
                >
                  {sendingOtp ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text
                      className={`text-sm font-bold ${
                        phoneChanged ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      {otpSent ? "Gửi lại" : "Gửi OTP"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {phoneChanged ? (
                <Text className="text-[11px] text-amber-600 mt-1.5 ml-1">
                  Đổi SĐT cần xác minh bằng OTP.
                </Text>
              ) : (
                <Text className="text-[11px] text-muted-foreground mt-1.5 ml-1">
                  Hiện tại: {maskPhone(originalPhone || "")}
                </Text>
              )}
            </View>

            {phoneChanged && otpSent ? (
              <View>
                <Text className="text-xs font-semibold text-muted-foreground mb-1.5 ml-1">
                  Mã OTP
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 flex-row items-center rounded-xl border border-border bg-card px-4 py-3.5">
                    <ShieldCheck size={16} color="#1a5fd4" strokeWidth={2.4} />
                    <TextInput
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="6 số"
                      placeholderTextColor="#94a3b8"
                      className="flex-1 ml-2 text-foreground tracking-widest"
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* Submit */}
          <View className="px-4 mt-7">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
              className="bg-primary rounded-xl py-4 flex-row items-center justify-center"
              style={{
                shadowColor: "#1a5fd4",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Lưu thay đổi
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
