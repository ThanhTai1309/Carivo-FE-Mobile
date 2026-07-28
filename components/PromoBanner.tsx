import { LinearGradient } from "expo-linear-gradient";
import { View, Text, TouchableOpacity } from "react-native";
import { Gift, Clock, Tag } from "lucide-react-native";

interface PromoBannerProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onPress?: () => void;
}

export default function PromoBanner({
  badge = "ƯU ĐÃI ĐỘC QUYỀN",
  title = "Giảm 50% cho lần rửa đầu tiên",
  subtitle,
  ctaText = "Nhận ngay",
  onPress,
}: PromoBannerProps) {
  return (
    <View className="mx-4 rounded-2xl overflow-hidden flex-row relative">
      {/* LEFT SIDE - Gradient với logo VOUCHER + icon */}
      <LinearGradient
        colors={["#1a5fd4", "#0d3fa8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 110,
          paddingVertical: 16,
          paddingHorizontal: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Badge nhỏ */}
        <View className="bg-amber-400 rounded-full px-2 py-0.5 mb-2">
          <Text
            className="text-amber-900 text-[9px] font-extrabold"
            style={{ letterSpacing: 0.5 }}
          >
            VOUCHER
          </Text>
        </View>
        {/* Icon quà */}
        <View
          className="rounded-full items-center justify-center mb-2"
          style={{
            width: 40,
            height: 40,
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Gift size={20} color="#ffffff" strokeWidth={2.2} />
        </View>
        {/* Tên rút gọn */}
        <Text
          className="text-white text-[11px] font-bold text-center leading-tight"
          numberOfLines={2}
        >
          {badge}
        </Text>
      </LinearGradient>

      {/* Đường cắt phân cách kiểu coupon */}
      <View
        className="relative"
        style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }}
      >
        <View
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#f9fafb",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -8,
            left: -8,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: "#f9fafb",
          }}
        />
      </View>

      {/* RIGHT SIDE - Nội dung chi tiết */}
      <View className="flex-1 bg-white px-4 py-3.5 justify-between">
        <View>
          {/* Tag nhỏ */}
          <View className="flex-row items-center gap-1 mb-1">
            <Tag size={10} color="#1a5fd4" strokeWidth={2.5} />
            <Text className="text-[10px] font-semibold text-primary uppercase">
              Ưu đãi mới
            </Text>
          </View>
          {/* Title */}
          <Text
            className="font-extrabold text-[15px] text-foreground leading-tight"
            numberOfLines={2}
          >
            {title}
          </Text>
          {/* Subtitle */}
          {subtitle ? (
            <Text
              className="text-[11px] text-muted-foreground mt-1 leading-4"
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Footer: Thời hạn + CTA */}
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-1">
            <Clock size={10} color="#7a8599" strokeWidth={2} />
            <Text className="text-[10px] text-muted-foreground">
              Áp dụng toàn quốc
            </Text>
          </View>
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            className="bg-primary rounded-lg px-3 py-1.5"
          >
            <Text className="text-white text-[11px] font-bold">{ctaText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
