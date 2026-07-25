import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

interface SkeletonCardProps {
  height?: number;
  lines?: number;
  className?: string;
  style?: ViewStyle;
}

export default function SkeletonCard({
  height = 80,
  lines = 1,
  className = "",
  style,
}: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`rounded-2xl bg-card border border-border p-4 gap-2.5 ${className}`}
      style={[{ minHeight: height, opacity }, style]}
    >
      <View className="h-3 w-1/3 bg-secondary rounded-full" />
      {Array.from({ length: lines }).map((_, idx) => (
        <View
          key={idx}
          className="h-3 bg-secondary rounded-full"
          style={{ width: idx === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </Animated.View>
  );
}
