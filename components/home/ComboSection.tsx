import { ScrollView, View, Text, TouchableOpacity, Image } from "react-native";
import { Gift, Star, ArrowRight, Crown, Sparkles, Zap } from "lucide-react-native";

interface ComboItem {
  id: string;
  name: string;
  subtitle: string;
  services: string[];
  originalPrice: number;
  comboPrice: number;
  discount: number;
  badge: string;
  badgeColor: string;
  imageUrl: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const COMBOS: ComboItem[] = [
  {
    id: "combo-family",
    name: "Combo Gia Đình",
    subtitle: "Giải pháp toàn diện cho xe của bạn",
    services: ["Rửa ngoài tiêu chuẩn", "Dọn nội thất", "Khử trùng nano"],
    originalPrice: 450000,
    comboPrice: 350000,
    discount: 22,
    badge: "BESTSELLER",
    badgeColor: "#ef4444",
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&h=300&fit=crop",
    icon: Crown,
  },
  {
    id: "combo-vip",
    name: "Combo VIP",
    subtitle: "Trải nghiệm cao cấp nhất",
    services: ["Rửa Premium", "Phủ Ceramic Nano", "Đánh bóng sơn", "Khử trùng ozone"],
    originalPrice: 850000,
    comboPrice: 599000,
    discount: 30,
    badge: "PREMIUM",
    badgeColor: "#f59e0b",
    imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop",
    icon: Sparkles,
  },
  {
    id: "combo-quick",
    name: "Combo Nhanh",
    subtitle: "Tiết kiệm thời gian",
    services: ["Rửa tiêu chuẩn", "Hút bụi nhanh", "Lau dử màn"],
    originalPrice: 250000,
    comboPrice: 199000,
    discount: 20,
    badge: "TIẾT KIỆM",
    badgeColor: "#10b981",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    icon: Zap,
  },
];

interface ComboSectionProps {
  onSelect?: (combo: ComboItem) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}

export default function ComboSection({ onSelect }: ComboSectionProps) {
  return (
    <View className="mt-8">
      <View className="px-4 flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-6 rounded-full bg-amber-500" />
          <Text className="font-bold text-xl text-foreground">Combo đặc biệt</Text>
        </View>
        <TouchableOpacity onPress={() => {}} className="flex-row items-center gap-1">
          <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
          <ArrowRight size={14} color="#1a5fd4" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      >
        {COMBOS.map((combo) => {
          const Icon = combo.icon;
          return (
            <TouchableOpacity
              key={combo.id}
              onPress={() => onSelect?.(combo)}
              activeOpacity={0.85}
              className="w-72 mr-4 bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Image with overlay */}
              <View className="relative h-36">
                <Image
                  source={{ uri: combo.imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badge */}
                <View
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: combo.badgeColor }}
                >
                  <Text className="text-white text-[10px] font-bold tracking-wide">
                    {combo.badge}
                  </Text>
                </View>

                {/* Icon overlay */}
                <View className="absolute bottom-3 left-3 flex-row items-center gap-2">
                  <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center backdrop-blur-sm">
                    <Icon size={20} color="#ffffff" strokeWidth={2} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">{combo.name}</Text>
                    <Text className="text-white/80 text-xs">{combo.subtitle}</Text>
                  </View>
                </View>
              </View>

              {/* Content */}
              <View className="p-4">
                {/* Services list */}
                <View className="mb-3">
                  {combo.services.map((service, idx) => (
                    <View key={idx} className="flex-row items-center gap-2 mb-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <Text className="text-xs text-foreground">{service}</Text>
                    </View>
                  ))}
                </View>

                {/* Price */}
                <View className="flex-row items-end justify-between">
                  <View>
                    <Text className="text-xs text-muted-foreground line-through">
                      {formatCurrency(combo.originalPrice)}
                    </Text>
                    <Text className="text-lg font-bold text-primary">
                      {formatCurrency(combo.comboPrice)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Gift size={14} color="#ef4444" strokeWidth={2.5} />
                    <Text className="text-xs font-bold text-red-500">
                      Giảm {combo.discount}%
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { COMBOS };
