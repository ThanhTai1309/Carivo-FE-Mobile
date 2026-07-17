import type { LucideIcon } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { formatCurrency } from "@/lib/format";
import type { ServicePackage } from "@/lib/types";

interface FeaturedServiceCardProps {
  service: ServicePackage;
  icon: LucideIcon;
  isFirst?: boolean;
  onPress?: () => void;
}

export default function FeaturedServiceCard({
  service,
  icon: Icon,
  isFirst = false,
  onPress,
}: FeaturedServiceCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`w-36 bg-card rounded-xl border border-border overflow-hidden ${
        isFirst ? "ml-4" : "ml-3"
      } mr-1`}
    >
      <View className="w-full bg-secondary items-center justify-center py-4">
        <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
          <Icon size={24} color="#ffffff" strokeWidth={1.85} />
        </View>
      </View>

      <View className="px-3 py-3">
        <Text
          className="font-semibold text-sm text-foreground leading-tight"
          numberOfLines={2}
        >
          {service.name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-1">
          {service.duration_minutes} phút
        </Text>
        <Text className="font-bold text-base text-primary mt-2">
          {formatCurrency(service.base_price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
