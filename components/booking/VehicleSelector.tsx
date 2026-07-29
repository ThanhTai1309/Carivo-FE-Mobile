import { Text, TouchableOpacity, View } from "react-native";
import { Car, Check, LucideIcon, Plus } from "lucide-react-native";

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
  onAdd: () => void;
}

export default function VehicleSelector({
  vehicles,
  selectedId,
  onSelect,
  onAdd,
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
        {vehicles.length === 0 ? (
          <View className="rounded-2xl border border-border bg-card px-5 py-5 items-center">
            <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
              <Car size={24} color="#1a5fd4" strokeWidth={2.2} />
            </View>
            <Text className="mt-3 text-base font-bold text-foreground">
              Bạn chưa có phương tiện
            </Text>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground text-center">
              Thêm thông tin xe để hệ thống hiển thị đúng dịch vụ và mức giá.
            </Text>
            <TouchableOpacity
              onPress={onAdd}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Thêm phương tiện"
              className="mt-4 min-h-12 rounded-xl bg-primary px-5 flex-row items-center justify-center gap-2"
            >
              <Plus size={18} color="#ffffff" strokeWidth={2.8} />
              <Text className="text-white text-sm font-bold">
                Thêm phương tiện
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((vehicle) => {
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
          })
        )}
      </View>
    </View>
  );
}
