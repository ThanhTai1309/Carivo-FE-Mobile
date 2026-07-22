import { LinearGradient } from "expo-linear-gradient";
import { View, Text, TouchableOpacity } from "react-native";

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
  ctaText = "Nhan ngay",
  onPress,
}: PromoBannerProps) {
  return (
    <View className="mx-4 rounded-xl overflow-hidden" style={{ height: 140 }}>
      <LinearGradient
        colors={["#1a5fd4", "#0d3fa8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      <View className="absolute inset-0 p-4 justify-between">
        <View>
          <View className="bg-white/20 rounded-sm px-2 py-1 self-start mb-2">
            <Text className="text-white text-xs font-semibold">{badge}</Text>
          </View>
          <Text
            className="text-white font-bold text-xl leading-tight"
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-white/80 text-sm mt-1 leading-5" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onPress}
          className="bg-white rounded-lg px-4 py-2 self-start"
        >
          <Text className="text-primary font-semibold text-sm">{ctaText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
