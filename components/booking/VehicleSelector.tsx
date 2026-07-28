import { Text, TouchableOpacity, View } from "react-native";
import { Check, LucideIcon } from "lucide-react-native";

interface Vehicle {
  id: string;
  icon: LucideIcon;
  name: string;
  plate: string;
}

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function VehicleSelector({
  vehicles,
  selectedId,
  onSelect,
}: VehicleSelectorProps) {
  const hasSelection = Boolean(selectedId);

  return (
    <View className="px-4 mb-6">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-1.5 h-6 rounded-full bg-primary" />
        <Text className="font-bold text-xl text-foreground flex-1">
          Phương tiện của bạn
        </Text>
        {hasSelection ? (
          <TouchableOpacity
            onPress={() => onSelect("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-primary text-sm font-medium">
              Thay đổi
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-xs text-muted-foreground">
            {vehicles.length} xe
          </Text>
        )}
      </View>

      <View className="gap-2.5">
        {vehicles.map((vehicle) => {
          const Icon = vehicle.icon;
          const selected = vehicle.id === selectedId;
          return (
            <TouchableOpacity
              key={vehicle.id}
              onPress={() => onSelect(vehicle.id)}
              activeOpacity={0.8}
              className={`flex-row items-center gap-3 bg-card rounded-xl border-2 px-4 py-3 ${
                selected ? "border-primary" : "border-border"
              }`}
            >
              <View
                className={`w-11 h-11 rounded-lg items-center justify-center ${
                  selected ? "bg-secondary" : "bg-secondary"
                }`}
              >
                <Icon size={22} color="#1a5fd4" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text
                  className="font-semibold text-sm text-foreground leading-tight"
                  numberOfLines={1}
                >
                  {vehicle.name}
                </Text>
                <Text
                  className="text-xs text-muted-foreground mt-0.5"
                  numberOfLines={1}
                >
                  {vehicle.plate}
                </Text>
              </View>
              {selected ? (
                <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
                  <Check size={16} color="#ffffff" strokeWidth={3} />
                </View>
              ) : (
                <View className="w-7 h-7 rounded-full border-2 border-border" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}