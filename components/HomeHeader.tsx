import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Bell } from "lucide-react-native";
import { api, ApiError } from "@/lib/api";

interface HomeHeaderProps {
  userName?: string;
  avatarUrl?: string;
  accessToken?: string | null;
  onNotificationPress?: () => void;
}

export default function HomeHeader({
  userName = "User",
  avatarUrl = "https://storage.googleapis.com/banani-avatars/avatar/male/25-35/European/0",
  accessToken,
  onNotificationPress,
}: HomeHeaderProps) {
  const resolvedAvatarUrl =
    avatarUrl && avatarUrl.trim().length > 0
      ? avatarUrl
      : "https://storage.googleapis.com/banani-avatars/avatar/male/25-35/European/0";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    const fetchCount = async () => {
      try {
        const response = await api.getUnreadNotificationCount(accessToken);
        if (!cancelled) {
          setUnreadCount(response.data?.unread_count ?? 0);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          // ignore - giữ giá trị cũ
        }
      }
    };

    void fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken]);

  const badgeText = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <View className="flex-row items-center justify-between px-4 pt-4 pb-3 bg-background">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-border">
          <Image source={{ uri: resolvedAvatarUrl }} className="w-10 h-10" />
        </View>
        <View>
          <Text className="text-muted-foreground text-xs">{greeting},</Text>
          <Text className="text-primary font-bold text-base leading-tight">
            {userName}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onNotificationPress}
        className="w-9 h-9 items-center justify-center rounded-lg bg-card border border-border relative"
        accessibilityLabel={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ""}`}
      >
        <Bell size={18} color="#0d0d0d" strokeWidth={2.7} />
        {unreadCount > 0 ? (
          <View
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 items-center justify-center"
            style={{ borderWidth: 2, borderColor: "#ffffff" }}
          >
            <Text className="text-[10px] font-bold text-white">
              {badgeText}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}
