import { Car, ChevronRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface VehicleCardProps {
  name: string;
  plate: string;
  isDefault?: boolean;
  onPress?: () => void;
}

export default function VehicleCard({
  name,
  plate,
  isDefault = false,
  onPress,
}: VehicleCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`w-52 bg-card rounded-xl border-2 ${
        isDefault ? "border-primary" : "border-border"
      } flex-row items-center px-3 py-3 gap-3`}
    >
      <View className="w-11 h-11 rounded-lg bg-secondary items-center justify-center flex-shrink-0">
        <Car size={22} color="#1a5fd4" strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-sm text-foreground leading-tight" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{plate}</Text>
      </View>
      <ChevronRight size={14} color="#7a8599" strokeWidth={3} />
    </TouchableOpacity>
  );
}
