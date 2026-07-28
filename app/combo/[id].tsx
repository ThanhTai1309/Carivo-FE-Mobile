import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  Crown,
  Sparkles,
  Zap,
  Gift,
  Droplets,
  Armchair,
  ShieldCheck,
} from "lucide-react-native";

interface ComboDetail {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  services: { name: string; description: string; icon: string }[];
  originalPrice: number;
  comboPrice: number;
  discount: number;
  badge: string;
  badgeColor: string;
  imageUrl: string;
  images: string[];
  duration: number;
  rating: number;
  reviewCount: number;
}

const COMBOS_DATA: Record<string, ComboDetail> = {
  "combo-family": {
    id: "combo-family",
    name: "Combo Gia Đình",
    subtitle: "Giải pháp toàn diện cho xe của bạn",
    description:
      "Combo Gia Đình là gói dịch vụ toàn diện nhất, kết hợp rửa ngoài, dọn nội thất và khử trùng. Đây là lựa chọn hoàn hảo cho những ai muốn xe luôn sạch sẽ từ trong ra ngoài.",
    services: [
      { name: "Rửa ngoài tiêu chuẩn", description: "Rửa sạch bụi bẩn, lau khô và kiểm tra nhanh", icon: "Droplets" },
      { name: "Dọn nội thất", description: "Hút bụi, lau bảng điều khiển, làm sạch ghế", icon: "Armchair" },
      { name: "Khử trùng Nano", description: "Khử khuẩn, làm sạch không khí trong xe", icon: "ShieldCheck" },
    ],
    originalPrice: 450000,
    comboPrice: 350000,
    discount: 22,
    badge: "BESTSELLER",
    badgeColor: "#ef4444",
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
    ],
    duration: 90,
    rating: 4.9,
    reviewCount: 567,
  },
  "combo-vip": {
    id: "combo-vip",
    name: "Combo VIP",
    subtitle: "Trải nghiệm cao cấp nhất",
    description:
      "Combo VIP mang đến trải nghiệm cao cấp với các dịch vụ premium nhất tại Carivo. Phủ Ceramic Nano giúp bảo vệ sơn xe tối ưu, kết hợp đánh bóng và khử trùng ozone cho chiếc xe hoàn hảo.",
    services: [
      { name: "Rửa Premium", description: "Rửa ngoài cao cấp với sáp bóng mờ chuyên dụng", icon: "Droplets" },
      { name: "Phủ Ceramic Nano", description: "Bảo vệ sơn, chống trầy xước, bóng đẹp lâu dài", icon: "Sparkles" },
      { name: "Đánh bóng sơn", description: "Đánh bóng loại bỏ vết xước nhẹ và oxide", icon: "Sparkles" },
      { name: "Khử trùng Ozone", description: "Khử trùng triệt để không gian bên trong xe", icon: "ShieldCheck" },
    ],
    originalPrice: 850000,
    comboPrice: 599000,
    discount: 30,
    badge: "PREMIUM",
    badgeColor: "#f59e0b",
    imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
    ],
    duration: 180,
    rating: 4.8,
    reviewCount: 234,
  },
  "combo-quick": {
    id: "combo-quick",
    name: "Combo Nhanh",
    subtitle: "Tiết kiệm thời gian",
    description:
      "Combo Nhanh là lựa chọn lý tưởng cho những ai bận rộn nhưng vẫn muốn xe luôn sạch sẽ. Quy trình được tối ưu hóa để hoàn thành nhanh chóng mà vẫn đảm bảo chất lượng.",
    services: [
      { name: "Rửa tiêu chuẩn", description: "Rửa ngoài nhanh chóng, lau khô sạch sẽ", icon: "Droplets" },
      { name: "Hút bụi nhanh", description: "Hút bụi cơ bản sàn và ghế", icon: "Armchair" },
      { name: "Lau dử màn", description: "Lau sạch bụi trên kính và gương", icon: "ShieldCheck" },
    ],
    originalPrice: 250000,
    comboPrice: 199000,
    discount: 20,
    badge: "TIẾT KIỆM",
    badgeColor: "#10b981",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
    ],
    duration: 45,
    rating: 4.7,
    reviewCount: 890,
  },
};

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}

function getIcon(iconName: string) {
  switch (iconName) {
    case "Droplets":
      return Droplets;
    case "Armchair":
      return Armchair;
    case "ShieldCheck":
      return ShieldCheck;
    case "Sparkles":
      return Sparkles;
    default:
      return Crown;
  }
}

export default function ComboDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const comboId = params.id;

  const combo = comboId ? COMBOS_DATA[comboId] : null;

  if (!combo) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 pt-3 pb-4 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Không tìm thấy</Text>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground text-center">
            Combo này không tồn tại hoặc đã bị xóa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-3 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-card items-center justify-center"
            >
              <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Chi tiết Combo</Text>
          </View>
        </View>

        {/* Hero Image */}
        <View className="px-4">
          <View className="rounded-2xl overflow-hidden h-56 relative">
            <Image
              source={{ uri: combo.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Badge */}
            <View
              className="absolute top-3 left-3 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: combo.badgeColor }}
            >
              <Text className="text-white text-xs font-bold tracking-wide">
                {combo.badge}
              </Text>
            </View>

            {/* Title overlay */}
            <View className="absolute bottom-4 left-4 right-4">
              <Text className="text-white font-bold text-2xl">{combo.name}</Text>
              <Text className="text-white/80 text-sm mt-1">{combo.subtitle}</Text>
            </View>
          </View>
        </View>

        {/* Combo Info */}
        <View className="px-4 mt-5">
          {/* Rating & Duration */}
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Star size={16} color="#f59e0b" strokeWidth={2} fill="#f59e0b" />
              <Text className="text-sm font-semibold text-foreground">
                {combo.rating}
              </Text>
              <Text className="text-sm text-muted-foreground">
                ({combo.reviewCount.toLocaleString("vi-VN")} đánh giá)
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color="#7a8599" strokeWidth={2} />
              <Text className="text-sm text-muted-foreground">
                ~{combo.duration} phút
              </Text>
            </View>
          </View>

          {/* Price Card */}
          <View className="mt-4 p-5 bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl border border-primary/20">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-muted-foreground">
                  Giá gốc
                </Text>
                <Text className="text-lg text-muted-foreground line-through">
                  {formatCurrency(combo.originalPrice)}
                </Text>
              </View>
              <View className="items-center">
                <View
                  className="px-2.5 py-1 rounded-full bg-red-500 mb-1"
                >
                  <Text className="text-white text-xs font-bold">
                    GIẢM {combo.discount}%
                  </Text>
                </View>
                <Text className="text-3xl font-bold text-primary">
                  {formatCurrency(combo.comboPrice)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-primary/20">
              <Gift size={16} color="#ef4444" strokeWidth={2.5} />
              <Text className="text-sm text-foreground flex-1">
                Tiết kiệm được{" "}
                <Text className="font-bold text-red-500">
                  {formatCurrency(combo.originalPrice - combo.comboPrice)}
                </Text>{" "}
                khi chọn combo này!
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-5 rounded-full bg-primary" />
            <Text className="font-bold text-lg text-foreground">Giới thiệu Combo</Text>
          </View>
          <Text className="text-sm text-foreground leading-relaxed">
            {combo.description}
          </Text>
        </View>

        {/* Services included */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <Text className="font-bold text-lg text-foreground">
              Dịch vụ trong Combo
            </Text>
          </View>
          <View className="gap-3">
            {combo.services.map((service, index) => {
              const IconComponent = getIcon(service.icon);
              return (
                <View
                  key={index}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <View className="flex-row items-start gap-4">
                    <View className="w-12 h-12 rounded-xl bg-emerald-100 items-center justify-center">
                      <IconComponent
                        size={24}
                        color="#10b981"
                        strokeWidth={1.8}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-foreground text-base">
                        {service.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {service.description}
                      </Text>
                    </View>
                    <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Images Gallery */}
        <View className="px-4 mt-6 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-5 rounded-full bg-purple-500" />
            <Text className="font-bold text-lg text-foreground">Hình ảnh minh họa</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {combo.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                className="w-72 h-48 rounded-xl"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute left-0 right-0 bottom-0 px-4 py-4 bg-background border-t border-border">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/booking",
            })
          }
          activeOpacity={0.85}
          className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{
            shadowColor: "#1a5fd4",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.28,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text className="text-white font-bold text-lg">
            Đặt lịch Combo {combo.name}
          </Text>
          <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
