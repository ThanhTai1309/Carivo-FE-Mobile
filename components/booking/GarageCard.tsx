import { View, Text, Image, Pressable, Animated } from "react-native";
import { Check, MapPin, Star } from "lucide-react-native";
import { useEffect, useRef } from "react";

interface GarageCardProps {
  name: string;
  distance: string;
  rating: string;
  imageUrl: string;
  badge?: string;
  selected?: boolean;
  onPress?: () => void;
  index?: number;
}

export default function GarageCard({
  name,
  distance,
  rating,
  imageUrl,
  badge,
  selected = false,
  onPress,
  index = 0,
}: GarageCardProps) {
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(index * 70),
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(index * 70),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index, opacity, scale]);

  const handlePressIn = () => {
    Animated.spring(press, {
      toValue: 0.98,
      damping: 14,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(press, {
      toValue: 1,
      damping: 12,
      useNativeDriver: true,
    }).start();
  };

  const cardStyle = {
    transform: [{ scale: Animated.multiply(scale, press) }],
    opacity,
  };

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        className={`relative bg-card rounded-xl border-2 overflow-hidden ${
          selected ? "border-primary" : "border-border"
        }`}
      >
        {selected ? (
          <View className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-primary items-center justify-center">
            <Check size={16} color="#ffffff" strokeWidth={3} />
          </View>
        ) : badge ? (
          <View
            className="absolute top-2.5 right-2.5 z-10 rounded-full px-2.5 py-1"
            style={{ backgroundColor: "rgba(15,23,42,0.7)" }}
          >
            <Text className="text-white text-[10px] font-extrabold tracking-wide uppercase">
              {badge}
            </Text>
          </View>
        ) : null}

        <View className="flex-row gap-3 p-3 items-center">
          <View
            className="rounded-xl overflow-hidden"
            style={{ width: 64, height: 64 }}
          >
            <Image
              source={{ uri: imageUrl }}
              className="w-16 h-16"
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-bold text-foreground leading-tight"
              numberOfLines={1}
            >
              {name}
            </Text>
            <View className="flex-row items-center gap-1 mt-1.5">
              <MapPin size={12} color="#7a8599" strokeWidth={2.4} />
              <Text
                className="text-xs text-muted-foreground"
                numberOfLines={1}
              >
                {distance}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Star
                size={12}
                color="#f59e0b"
                strokeWidth={2.4}
                fill="#f59e0b"
              />
              <Text className="text-xs font-bold text-foreground">
                {rating}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}