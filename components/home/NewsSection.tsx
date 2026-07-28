import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { Lightbulb, Trophy, Gift, PartyPopper, Megaphone, BookOpen, ChevronRight } from "lucide-react-native";

type NewsCategory = "tips" | "membership" | "event" | "promotion" | "contest" | "blog";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  category: NewsCategory;
  categoryLabel: string;
  date: string;
  imageUrl: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  accentColor: string;
}

const NEWS: NewsItem[] = [
  {
    id: "tips-1",
    title: "5 Mẹo Bảo Vệ Sơn Xe Mùa Mưa",
    description: "Những cách đơn giản giúp sơn xe bền đẹp quanh năm, đặc biệt trong mùa mưa bão.",
    category: "tips",
    categoryLabel: "Mẹo hay",
    date: "28/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400&h=250&fit=crop",
    icon: Lightbulb,
    accentColor: "#f59e0b",
  },
  {
    id: "membership-1",
    title: "Nâng Hạng Vàng - Nhận Ưu Đãi 30%",
    description: "Tích điểm để thăng hạng thành viên và nhận ngay ưu đãi giảm giá 30% cho mọi dịch vụ.",
    category: "membership",
    categoryLabel: "Thành viên",
    date: "27/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=250&fit=crop",
    icon: Trophy,
    accentColor: "#eab308",
  },
  {
    id: "event-1",
    title: "Rửa 5 Lần - Nhận Voucher 50K",
    description: "Đặt lịch và rửa xe 5 lần trong tháng, nhận ngay voucher giảm 50.000đ cho lần tiếp theo.",
    category: "event",
    categoryLabel: "Sự kiện",
    date: "26/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=250&fit=crop",
    icon: Gift,
    accentColor: "#ec4899",
  },
  {
    id: "contest-1",
    title: "Bốc Thăm May Mắn - Trúng Tour Mùa Hè",
    description: "Hoàn thành 10 lượt rửa xe trong quý, tham gia bốc thăm trúng tour du lịch mùa hè 1 tuần.",
    category: "contest",
    categoryLabel: "Bốc thăm",
    date: "25/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=250&fit=crop",
    icon: PartyPopper,
    accentColor: "#8b5cf6",
  },
  {
    id: "promotion-1",
    title: "Tuần Này: Giảm 20% Ceramic Nano",
    description: "Chỉ áp dụng tuần này! Đặt lịch phủ Ceramic Nano, giảm ngay 20% chi phí.",
    category: "promotion",
    categoryLabel: "Khuyến mãi",
    date: "24/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=400&h=250&fit=crop",
    icon: Megaphone,
    accentColor: "#ef4444",
  },
  {
    id: "blog-1",
    title: "Trải Nghiệm Rửa Xe Carivo - Có Gì Đặc Biệt?",
    description: "Chia sẻ thực tế từ khách hàng về trải nghiệm dịch vụ tại Carivo Garage.",
    category: "blog",
    categoryLabel: "Chia sẻ",
    date: "23/07/2026",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop",
    icon: BookOpen,
    accentColor: "#10b981",
  },
];

interface NewsSectionProps {
  onSelect?: (news: NewsItem) => void;
}

export default function NewsSection({ onSelect }: NewsSectionProps) {
  return (
    <View className="mt-8">
      <View className="px-4 flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-6 rounded-full bg-emerald-500" />
          <Text className="font-bold text-xl text-foreground">Tin tức & Sự kiện</Text>
        </View>
        <TouchableOpacity onPress={() => {}} className="flex-row items-center gap-1">
          <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
          <ChevronRight size={14} color="#1a5fd4" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Featured News */}
      <View className="px-4 mb-4">
        <TouchableOpacity
          onPress={() => onSelect?.(NEWS[0])}
          activeOpacity={0.85}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <View className="relative h-44">
            <Image
              source={{ uri: NEWS[0].imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Category badge */}
            <View
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: NEWS[0].accentColor }}
            >
              <Text className="text-white text-[10px] font-bold tracking-wide">
                {NEWS[0].categoryLabel}
              </Text>
            </View>

            {/* Content overlay */}
            <View className="absolute bottom-0 left-0 right-0 p-4">
              <Text className="text-white font-bold text-lg leading-tight mb-1">
                {NEWS[0].title}
              </Text>
              <Text
                className="text-white/80 text-xs leading-relaxed"
                numberOfLines={2}
              >
                {NEWS[0].description}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* News List - 2 columns */}
      <View className="px-4">
        <View className="flex-row flex-wrap gap-3">
          {NEWS.slice(1, 5).map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelect?.(item)}
                activeOpacity={0.85}
                className="w-[calc(50%-6px)] bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Image */}
                <View className="h-24 relative">
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/20" />

                  {/* Category icon */}
                  <View
                    className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: item.accentColor }}
                  >
                    <Icon size={14} color="#ffffff" strokeWidth={2.5} />
                  </View>
                </View>

                {/* Content */}
                <View className="p-3">
                  <View
                    className="self-start px-2 py-0.5 rounded-full mb-2"
                    style={{ backgroundColor: `${item.accentColor}20` }}
                  >
                    <Text
                      className="text-[9px] font-bold"
                      style={{ color: item.accentColor }}
                    >
                      {item.categoryLabel}
                    </Text>
                  </View>
                  <Text
                    className="text-xs font-semibold text-foreground leading-tight mb-1"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="text-[10px] text-muted-foreground"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export { NEWS };
