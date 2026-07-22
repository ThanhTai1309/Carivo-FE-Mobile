import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Plus } from "lucide-react-native";
import VehicleCard from "./home/VehicleCard";

interface VehicleSummary {
  name: string;
  plate: string;
}

interface MyCarSectionProps {
  cars?: VehicleSummary[];
  isGuest?: boolean;
  onViewAll?: () => void;
  onCarPress?: (car: VehicleSummary) => void;
  onAddCar?: () => void;
}

export default function MyCarSection({
  cars = [],
  isGuest = false,
  onViewAll,
  onCarPress,
  onAddCar,
}: MyCarSectionProps) {
  return (
    <View className="mt-5">
      <View className="px-4 flex-row items-center justify-between mb-3">
        <Text className="font-bold text-xl text-foreground">Xe của tôi</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {cars.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {cars.map((car, index) => (
            <VehicleCard
              key={car.plate}
              name={car.name}
              plate={car.plate}
              isDefault={index === 0}
              onPress={() => onCarPress?.(car)}
            />
          ))}
          <TouchableOpacity
            onPress={onAddCar}
            className="w-16 h-[88px] bg-card rounded-xl border border-border items-center justify-center ml-3"
          >
            <View className="w-10 h-10 rounded-lg bg-muted items-center justify-center">
              <Plus size={20} color="#7a8599" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View className="mx-4 bg-card rounded-xl border border-border px-4 py-4">
          <Text className="font-semibold text-base text-foreground">
            {isGuest ? "Đăng nhập để lưu xe của bạn" : "Chưa có phương tiện"}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {isGuest
              ? "Tài khoản khách chỉ xem được thông tin công khai."
              : "Thêm xe để đặt lịch nhanh hơn ở lần sau."}
          </Text>
        </View>
      )}
    </View>
  );
}
