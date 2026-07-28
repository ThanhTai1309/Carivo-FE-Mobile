import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, Loader2 } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, ApiError } from "@/lib/api";
import type { Vehicle, VehicleType, EngineType } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const MOTORBIKE_CC_OPTIONS = [
  { label: "Dưới 175cc", value: "UNDER_175CC" },
  { label: "Trên 175cc", value: "OVER_175CC" },
] as const;

const CAR_BODY_OPTIONS = [
  { label: "Hatchback", value: "HATCHBACK" },
  { label: "Sedan", value: "SEDAN" },
  { label: "SUV", value: "SUV" },
  { label: "MPV", value: "MPV" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Van", value: "VAN" },
] as const;

type MotorbikeCC = "UNDER_175CC" | "OVER_175CC";
type CarBody = "HATCHBACK" | "SEDAN" | "SUV" | "MPV" | "PICKUP" | "VAN";

interface FormData {
  raw_license_plate: string;
  vehicle_type: VehicleType;
  engine_type: EngineType;
  motorbike_cc_group?: MotorbikeCC;
  car_body_type?: CarBody;
  seat_count?: string;
  brand: string;
  model: string;
  color: string;
  is_default: boolean;
}

const EMPTY_FORM: FormData = {
  raw_license_plate: "",
  vehicle_type: "CAR",
  engine_type: "GASOLINE",
  brand: "",
  model: "",
  color: "",
  is_default: false,
};

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-lg border border-border overflow-hidden">
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-2.5 items-center ${
              i > 0 ? "border-l border-border" : ""
            } ${active ? "bg-primary" : "bg-card"}`}
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-white" : "text-muted-foreground"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-5">
      <Text className="text-sm font-medium text-foreground mb-2">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function TextInputField({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <TextInput
      className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-base"
      placeholder={placeholder}
      placeholderTextColor="#7a8599"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  );
}

export default function VehicleFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accessToken } = useApp();

  const isEditMode = Boolean(id);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id && accessToken) {
      void loadVehicle();
    }
  }, [id, accessToken]);

  const loadVehicle = async () => {
    if (!id || !accessToken) return;
    try {
      setError(null);
      const response = await api.getVehicle(accessToken, id);
      const v: Vehicle | null = response.data;
      if (v) {
        setForm({
          raw_license_plate: v.raw_license_plate,
          vehicle_type: v.vehicle_type,
          engine_type: v.engine_type,
          motorbike_cc_group: v.motorbike_cc_group ?? undefined,
          car_body_type: v.car_body_type ?? undefined,
          seat_count: v.seat_count != null ? String(v.seat_count) : "",
          brand: v.brand ?? "",
          model: v.model ?? "",
          color: v.color ?? "",
          is_default: v.is_default ?? false,
        });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không thể tải thông tin xe.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setVehicleType = (vehicleType: VehicleType) => {
    setForm((prev) => ({
      ...prev,
      vehicle_type: vehicleType,
      motorbike_cc_group:
        vehicleType === "MOTORBIKE" ? prev.motorbike_cc_group : undefined,
      car_body_type: vehicleType === "CAR" ? prev.car_body_type : undefined,
      seat_count: vehicleType === "CAR" ? prev.seat_count : "",
    }));
  };

  const validate = (): boolean => {
    if (!form.raw_license_plate.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập biển số xe.");
      return false;
    }
    if (form.vehicle_type === "MOTORBIKE" && !form.motorbike_cc_group) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn phân khúc xe máy.");
      return false;
    }
    if (form.vehicle_type === "CAR") {
      if (!form.car_body_type) {
        Alert.alert("Thiếu thông tin", "Vui lòng chọn kiểu dáng ô tô.");
        return false;
      }
      if (!form.seat_count) {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập số chỗ ngồi.");
        return false;
      }
      const n = parseInt(form.seat_count, 10);
      if (isNaN(n) || n < 2 || n > 16) {
        Alert.alert("Số chỗ không hợp lệ", "Số chỗ ngồi phải từ 2 đến 16.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !accessToken) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        raw_license_plate: form.raw_license_plate.trim().toUpperCase(),
        vehicle_type: form.vehicle_type,
        engine_type: form.engine_type,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        color: form.color.trim() || undefined,
        is_default: form.is_default,
      };

      if (form.vehicle_type === "MOTORBIKE") {
        payload.motorbike_cc_group = form.motorbike_cc_group;
      } else {
        payload.car_body_type = form.car_body_type;
        payload.seat_count = parseInt(form.seat_count || "", 10);
      }

      if (isEditMode && id) {
        await api.updateVehicle(accessToken, id, payload);
        Alert.alert("Thành công", "Đã cập nhật thông tin xe.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await api.createVehicle(accessToken, payload as Parameters<typeof api.createVehicle>[1]);
        Alert.alert("Thành công", "Đã thêm xe mới.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : isEditMode
          ? "Không thể cập nhật xe."
          : "Không thể thêm xe.";
      Alert.alert("Lỗi", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Loader2 size={32} color="#1a5fd4" className="animate-spin" />
        <Text className="text-muted-foreground text-sm mt-3">Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pt-4 pb-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#0d0d0d" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="font-bold text-lg text-foreground">Lỗi</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-center mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              void loadVehicle();
            }}
            className="bg-primary rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#0d0d0d" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="font-bold text-lg text-foreground flex-1">
          {isEditMode ? "Sửa thông tin xe" : "Thêm xe mới"}
        </Text>
        {submitting && (
          <Loader2 size={20} color="#1a5fd4" className="animate-spin" />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Biển số */}
          <FormField label="Biển số xe" required>
            <TextInputField
              placeholder="VD: 30A-123.45"
              value={form.raw_license_plate}
              onChangeText={(v) => setField("raw_license_plate", v)}
              autoCapitalize="characters"
            />
          </FormField>

          {/* Loại xe */}
          <FormField label="Loại xe" required>
            <SegmentedControl
              options={[
                { label: "Ô tô", value: "CAR" as VehicleType },
                { label: "Xe máy", value: "MOTORBIKE" as VehicleType },
              ]}
              value={form.vehicle_type}
              onChange={setVehicleType}
            />
          </FormField>

          {/* Động cơ */}
          <FormField label="Loại động cơ" required>
            <SegmentedControl
              options={[
                { label: "Xăng", value: "GASOLINE" as EngineType },
                { label: "Điện", value: "ELECTRIC" as EngineType },
              ]}
              value={form.engine_type}
              onChange={(v) => setField("engine_type", v)}
            />
          </FormField>

          {/* Phân khúc xe máy */}
          {form.vehicle_type === "MOTORBIKE" && (
            <FormField label="Phân khúc" required>
              <SegmentedControl
                options={MOTORBIKE_CC_OPTIONS}
                value={form.motorbike_cc_group ?? ("" as MotorbikeCC)}
                onChange={(v) => setField("motorbike_cc_group", v)}
              />
            </FormField>
          )}

          {/* Kiểu dáng ô tô */}
          {form.vehicle_type === "CAR" && (
            <>
              <FormField label="Kiểu dáng" required>
                <View className="flex-row flex-wrap gap-2">
                  {CAR_BODY_OPTIONS.map((opt) => {
                    const active = form.car_body_type === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setField("car_body_type", opt.value)}
                        className={`rounded-xl border px-4 py-2.5 ${
                          active
                            ? "bg-primary border-primary"
                            : "bg-card border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            active ? "text-white" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FormField>

              {/* Số chỗ */}
              <FormField label="Số chỗ ngồi" required>
                <TextInputField
                  placeholder="VD: 5"
                  value={form.seat_count ?? ""}
                  onChangeText={(v) => setField("seat_count", v)}
                  keyboardType="numeric"
                />
              </FormField>
            </>
          )}

          {/* Hãng */}
          <FormField label="Hãng xe">
            <TextInputField
              placeholder="VD: Toyota, Honda, BMW..."
              value={form.brand}
              onChangeText={(v) => setField("brand", v)}
            />
          </FormField>

          {/* Mẫu xe */}
          <FormField label="Mẫu xe">
            <TextInputField
              placeholder="VD: Camry, Civic, X5..."
              value={form.model}
              onChangeText={(v) => setField("model", v)}
            />
          </FormField>

          {/* Màu */}
          <FormField label="Màu sắc">
            <TextInputField
              placeholder="VD: Trắng, Đen, Bạc..."
              value={form.color}
              onChangeText={(v) => setField("color", v)}
            />
          </FormField>

          {/* Mặc định */}
          <View className="flex-row items-center justify-between bg-card rounded-xl px-4 py-4 mb-6 border border-border">
            <View className="flex-1 pr-4">
              <Text className="font-semibold text-foreground text-sm">
                Đặt làm xe mặc định
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                Xe mặc định sẽ được chọn trước khi đặt lịch.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setField("is_default", !form.is_default)}
              className={`w-12 h-7 rounded-full p-1 justify-center ${
                form.is_default ? "bg-primary" : "bg-muted"
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white ${
                  form.is_default ? "self-end" : "self-start"
                }`}
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={() => void handleSubmit()}
            disabled={submitting}
            activeOpacity={0.8}
            className={`rounded-xl py-4 items-center ${
              submitting ? "bg-muted" : "bg-primary"
            }`}
          >
            <Text className="text-white font-bold text-base">
              {submitting
                ? isEditMode
                  ? "Đang lưu..."
                  : "Đang thêm..."
                : isEditMode
                ? "Lưu thay đổi"
                : "Thêm xe"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
