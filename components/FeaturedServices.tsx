import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { CarFront, Sparkles, Shield } from "lucide-react-native";
import FeaturedServiceCard from "./home/FeaturedServiceCard";
import type { ServicePackage } from "@/lib/types";

const ICON_MAP = [CarFront, Sparkles, Shield] as const;

interface FeaturedServicesProps {
  onSelect?: (service: ServicePackage) => void;
  services?: ServicePackage[];
}

export default function FeaturedServices({
  onSelect,
  services,
}: FeaturedServicesProps) {
  const displayServices =
    services && services.length > 0
      ? services
      : [];

  if (displayServices.length === 0) {
    return null;
  }

  return (
    <View className="mt-5">
      <View className="px-4 flex-row items-center justify-between mb-3">
        <Text className="font-bold text-xl text-foreground">Dịch vụ nổi bật</Text>
        <TouchableOpacity>
          <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {displayServices.map((service, index) => (
          <FeaturedServiceCard
            key={service.id}
            service={service}
            icon={ICON_MAP[index % ICON_MAP.length]}
            isFirst={index === 0}
            onPress={() => onSelect?.(service)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
