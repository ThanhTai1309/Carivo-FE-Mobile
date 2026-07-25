import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface TextInputDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger" | "success";
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  minLength?: number;
  loading?: boolean;
  multiline?: boolean;
}

export default function TextInputDialog({
  visible,
  title,
  description,
  placeholder,
  value,
  onChangeText,
  confirmLabel,
  confirmVariant = "primary",
  cancelLabel = "Huỷ",
  onConfirm,
  onCancel,
  minLength = 0,
  loading = false,
  multiline = true,
}: TextInputDialogProps) {
  const meets = value.trim().length >= minLength;
  const disabled = loading || !meets;

  const confirmBg =
    confirmVariant === "danger"
      ? "bg-red-600"
      : confirmVariant === "success"
      ? "bg-emerald-600"
      : "bg-primary";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-5 bg-black/40"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onCancel}
          className="absolute inset-0"
        />
        <View className="w-full rounded-2xl bg-card border border-border p-5">
          <Text className="text-base font-bold text-foreground">{title}</Text>
          {description ? (
            <Text className="text-xs text-muted-foreground mt-1.5 leading-5">
              {description}
            </Text>
          ) : null}
          <View className="mt-3 rounded-xl border border-border bg-input p-3">
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              multiline={multiline}
              textAlignVertical="top"
              maxLength={500}
              className="text-foreground min-h-[80px]"
            />
          </View>
          {minLength > 0 ? (
            <Text
              className={`text-[11px] mt-1 ${
                meets ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              Tối thiểu {minLength} ký tự ({value.trim().length}/{minLength})
            </Text>
          ) : null}
          <View className="flex-row justify-end gap-2 mt-4">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5"
            >
              <Text className="text-sm font-semibold text-foreground">
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={disabled}
              activeOpacity={0.85}
              className={`rounded-xl px-4 py-2.5 ${confirmBg} ${
                disabled ? "opacity-60" : ""
              }`}
            >
              <Text className="text-sm font-bold text-white">
                {loading ? "Đang xử lý..." : confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
