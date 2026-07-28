import { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CalendarDays, Sparkles } from "lucide-react-native";

interface DateItem {
  dayLabel: string;
  date: number;
  dateKey: string;
  monthLabel?: string;
  isToday?: boolean;
}

interface DateStripProps {
  dates: DateItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  goldBadge?: string;
}

interface DateCardProps {
  item: DateItem;
  index: number;
  selected: boolean;
  onPress: () => void;
}

function DateCard({ item, index, selected, onPress }: DateCardProps) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(index * 40),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(index * 40),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index, opacity, scale]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.92,
      damping: 14,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 12,
      useNativeDriver: true,
    }).start();
  };

  const cardStyle = {
    transform: [
      { scale: Animated.multiply(scale, pressScale) },
      { translateY: selected ? -4 : 0 },
    ],
    opacity,
  };

  return (
    <Animated.View style={[{ flex: 1 }, cardStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          className="rounded-2xl overflow-hidden relative"
          style={{
            backgroundColor: selected ? "transparent" : "#ffffff",
            borderWidth: selected ? 0 : 1,
            borderColor: "#e5e7eb",
            shadowColor: selected ? "#1a5fd4" : "#0f172a",
            shadowOffset: { width: 0, height: selected ? 6 : 1 },
            shadowOpacity: selected ? 0.25 : 0.04,
            shadowRadius: selected ? 10 : 4,
            elevation: selected ? 5 : 1,
          }}
        >
          {selected ? (
            <LinearGradient
              colors={["#1a5fd4", "#0d3fa8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : null}

          {/* Subtle today ring */}
          {item.isToday && !selected ? (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderWidth: 1.5,
                borderColor: "#1a5fd4",
                borderRadius: 16,
              }}
            />
          ) : null}

          <View
            className="py-3 items-center justify-center"
            style={{ minHeight: 78 }}
          >
            <Text
              className={`text-[10px] font-semibold tracking-wider uppercase ${
                selected ? "text-white/80" : "text-muted-foreground"
              }`}
              numberOfLines={1}
            >
              {item.dayLabel}
            </Text>
            <Text
              className={`text-xl font-extrabold mt-1 ${
                selected ? "text-white" : "text-foreground"
              }`}
            >
              {item.date}
            </Text>
            {item.monthLabel ? (
              <Text
                className={`text-[9px] font-semibold mt-0.5 ${
                  selected ? "text-white/70" : "text-muted-foreground"
                }`}
              >
                Th{item.monthLabel}
              </Text>
            ) : null}

            {/* Indicator dot */}
            {selected ? (
              <View
                style={{
                  marginTop: 4,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                }}
              />
            ) : (
              <View
                style={{
                  marginTop: 4,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: item.isToday ? "#1a5fd4" : "transparent",
                }}
              />
            )}
          </View>

          {/* Shine overlay */}
          {selected ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "40%",
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DateStrip({
  dates,
  selectedKey,
  onSelect,
  goldBadge,
}: DateStripProps) {
  return (
    <View className="mb-6">
      <View className="px-4 flex-row items-center gap-2 mb-3">
        <View className="w-1.5 h-6 rounded-full bg-primary" />
        <Text className="font-bold text-xl text-foreground flex-1">
          Chọn ngày
        </Text>
        {goldBadge ? (
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: "rgba(26,95,212,0.1)" }}
          >
            <Text
              className="text-[10px] font-bold tracking-wide uppercase"
              style={{ color: "#1a5fd4" }}
            >
              {goldBadge}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {dates.map((item, index) => (
          <View key={item.dateKey} style={{ width: 76 }}>
            <DateCard
              item={item}
              index={index}
              selected={item.dateKey === selectedKey}
              onPress={() => onSelect(item.dateKey)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}