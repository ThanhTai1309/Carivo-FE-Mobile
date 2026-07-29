import {
  Armchair,
  Car,
  ChevronRight,
  Droplets,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react-native";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { ServicePackage } from "@/lib/types";

const CARD_WIDTH = (Dimensions.get("window").width - 64) / 2.5;
const ICONS = [Droplets, Armchair, Sparkles, ShieldCheck, Car, Wrench];
const PALETTES = [
  { color: "#0ea5e9", backgroundColor: "#e0f2fe" },
  { color: "#8b5cf6", backgroundColor: "#ede9fe" },
  { color: "#f59e0b", backgroundColor: "#fef3c7" },
  { color: "#10b981", backgroundColor: "#d1fae5" },
  { color: "#6366f1", backgroundColor: "#e0e7ff" },
  { color: "#ef4444", backgroundColor: "#fee2e2" },
];

export default function FeaturedServiceGrid({
  services,
  onSelect,
}: {
  services: ServicePackage[];
  onSelect?: (service: ServicePackage) => void;
}) {
  const visibleServices = services
    .filter((service) => service.service_type !== "ADDON")
    .slice(0, 8);

  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-1.5 rounded-full bg-primary" />
          <Text className="text-xl font-bold text-foreground">
            Dịch vụ nổi bật
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-sm font-medium text-primary">
            {visibleServices.length} dịch vụ
          </Text>
          <ChevronRight size={14} color="#1a5fd4" strokeWidth={2.5} />
        </View>
      </View>

      {visibleServices.length === 0 ? (
        <View className="mx-4 rounded-2xl border border-dashed border-border bg-card p-5">
          <Text className="text-center text-sm text-muted-foreground">
            Chưa có dịch vụ khả dụng.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
        >
          {visibleServices.map((service, index) => {
            const Icon = ICONS[index % ICONS.length];
            const palette = PALETTES[index % PALETTES.length];
            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => onSelect?.(service)}
                activeOpacity={0.8}
                style={{ width: CARD_WIDTH }}
                className="mr-3 rounded-2xl border border-border bg-card p-3"
              >
                <View
                  className="mb-2 h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: palette.backgroundColor }}
                >
                  <Icon
                    size={24}
                    color={palette.color}
                    strokeWidth={1.8}
                  />
                </View>
                <Text
                  className="text-sm font-bold leading-tight text-foreground"
                  numberOfLines={2}
                >
                  {service.name}
                </Text>
                <Text
                  className="mt-1 text-[10px] leading-tight text-muted-foreground"
                  numberOfLines={2}
                >
                  {service.description || `${service.duration_minutes} phút`}
                </Text>
                {typeof service.rating_average === "number" ? (
                  <View className="mt-2 flex-row items-center gap-1">
                    <Star
                      size={11}
                      color="#f59e0b"
                      fill="#f59e0b"
                      strokeWidth={1.8}
                    />
                    <Text className="text-[11px] font-bold text-foreground">
                      {service.rating_average.toFixed(1)}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">
                      ({service.rating_count ?? 0})
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
