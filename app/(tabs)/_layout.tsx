import { Tabs } from "expo-router";
import { Home, Star, CalendarDays, History, User, Bell } from "lucide-react-native";
import { Text, View } from "react-native";
import { useNotifications } from "@/providers/NotificationsProvider";

const COLORS = {
  primary: "#1a5fd4",
  secondary: "#dbe7fb",
  mutedForeground: "#7a8599",
  card: "#ffffff",
  border: "#e2e8f0",
};

function TabIcon({
  icon: Icon,
  focused,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  focused: boolean;
}) {
  return (
    <View className={focused ? "bg-secondary rounded-lg px-3 py-1" : "px-3 py-1"}>
      <Icon
        size={22}
        color={focused ? COLORS.primary : COLORS.mutedForeground}
        strokeWidth={2.2}
      />
    </View>
  );
}

function BellIcon({ focused }: { focused: boolean }) {
  const { unreadCount } = useNotifications();
  const showBadge = unreadCount > 0;
  const display = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <View className="relative">
      <TabIcon icon={Bell} focused={focused} />
      {showBadge ? (
        <View className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 items-center justify-center">
          <Text className="text-white text-[10px] font-bold leading-none">
            {display}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Điểm thưởng",
          tabBarIcon: ({ focused }) => <TabIcon icon={Star} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: "Đặt lịch",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={CalendarDays} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Thông báo",
          tabBarIcon: ({ focused }) => <BellIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="booking-history"
        options={{
          title: "Lịch sử",
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={History} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
