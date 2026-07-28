import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import {
  Droplets,
  Armchair,
  Sparkles,
  ShieldCheck,
  Car,
  Wrench,
  ChevronRight,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 24) / 3; // 3 cards per row, with gaps
const CARD_WIDTH_HORIZONTAL = (SCREEN_WIDTH - 64) / 2.5; // Each card width for horizontal scroll

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  bgColor: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: "wash-standard",
    name: "Rửa tiêu chuẩn",
    description: "Rửa ngoài, lau khô, kiểm tra nhanh",
    icon: Droplets,
    color: "#0ea5e9",
    bgColor: "#e0f2fe",
  },
  {
    id: "interior",
    name: "Dọn nội thất",
    description: "Hút bụi, lau bảng điều khiển, làm sạch ghế",
    icon: Armchair,
    color: "#8b5cf6",
    bgColor: "#ede9fe",
  },
  {
    id: "ceramic",
    name: "Phủ Ceramic",
    description: "Bảo vệ sơn, bóng đẹp lâu dài",
    icon: Sparkles,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  {
    id: "sanitize",
    name: "Khử trùng",
    description: "Khử khuẩn, làm sạch không khí trong xe",
    icon: ShieldCheck,
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  {
    id: "polish",
    name: "Đánh bóng",
    description: "Đánh bóng sơn xe, loại bỏ vết xước nhẹ",
    icon: Car,
    color: "#6366f1",
    bgColor: "#e0e7ff",
  },
  {
    id: "maintenance",
    name: "Bảo dưỡng",
    description: "Kiểm tra, thay nhớt, phanh, lốp",
    icon: Wrench,
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
];

interface FeaturedServiceGridProps {
  onSelect?: (service: ServiceItem) => void;
}

export default function FeaturedServiceGrid({ onSelect }: FeaturedServiceGridProps) {
  return (
    <View className="mt-6">
      <View className="px-4 flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-6 rounded-full bg-primary" />
          <Text className="font-bold text-xl text-foreground">Dịch vụ nổi bật</Text>
        </View>
        <TouchableOpacity onPress={() => {}} className="flex-row items-center gap-1">
          <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
          <ChevronRight size={14} color="#1a5fd4" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll với 6 dịch vụ trên 1 hàng */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      >
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <TouchableOpacity
              key={service.id}
              onPress={() => onSelect?.(service)}
              activeOpacity={0.8}
              style={{ width: CARD_WIDTH_HORIZONTAL }}
              className="mr-3 bg-card rounded-2xl border border-border p-3 items-center"
            >
              {/* Icon Container */}
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                style={{ backgroundColor: service.bgColor }}
              >
                <Icon size={24} color={service.color} strokeWidth={1.8} />
              </View>
              {/* Service Name */}
              <Text
                className="font-bold text-sm text-foreground text-center leading-tight mb-1"
                numberOfLines={1}
              >
                {service.name}
              </Text>
              {/* Short Description */}
              <Text
                className="text-[10px] text-muted-foreground text-center leading-tight"
                numberOfLines={2}
              >
                {service.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { SERVICES };
