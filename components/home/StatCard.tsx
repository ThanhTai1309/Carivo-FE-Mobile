import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  tone?: "primary" | "dark";
}

export default function StatCard({
  icon: Icon,
  value,
  label,
  tone = "primary",
}: StatCardProps) {
  const bgClass = tone === "primary" ? "bg-secondary" : "bg-dark";
  const iconColor = tone === "primary" ? "#1a5fd4" : "#ffffff";
  const valueColor = tone === "primary" ? "text-primary" : "text-white";
  const labelColor = tone === "primary" ? "text-muted-foreground" : "text-white/70";

  return (
    <View className={`flex-1 ${bgClass} rounded-xl p-4`}>
      <Icon size={22} color={iconColor} strokeWidth={2} />
      <Text className={`${valueColor} font-bold text-2xl mt-2`}>
        {value}
      </Text>
      <Text className={`${labelColor} text-sm mt-1`} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
