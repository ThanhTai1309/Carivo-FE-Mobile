import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Bell } from "lucide-react-native";

interface NotificationRationaleModalProps {
  visible: boolean;
  onDismiss: () => void;
  onEnable: () => Promise<void>;
}

export default function NotificationRationaleModal({
  visible,
  onDismiss,
  onEnable,
}: NotificationRationaleModalProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible]);

  const handleEnable = async () => {
    setBusy(true);
    try {
      await onEnable();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/50 justify-center px-6">
        <View className="bg-card rounded-3xl p-6 items-center">
          <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
            <Bell size={28} color="#1a5fd4" strokeWidth={2.2} />
          </View>
          <Text className="text-lg font-bold text-foreground text-center">
            Bật thông báo cho Carivo?
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-3 leading-5">
            Gửi thông báo để cập nhật booking, thanh toán, điểm thưởng và khuyến
            mãi dành riêng cho bạn. Bạn có thể tắt bất kỳ lúc nào trong phần
            Cài đặt của thiết bị.
          </Text>
          <TouchableOpacity
            disabled={busy}
            onPress={() => void handleEnable()}
            className={`w-full rounded-2xl py-3 items-center mt-6 ${
              busy ? "bg-primary/60" : "bg-primary"
            }`}
          >
            <Text className="text-white font-semibold">
              {busy ? "Đang bật..." : "Bật thông báo"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={busy}
            onPress={onDismiss}
            className="w-full rounded-2xl py-3 items-center mt-2"
          >
            <Text className="text-muted-foreground font-medium">
              Để sau
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}