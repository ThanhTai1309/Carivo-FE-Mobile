import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Check, Clock4, X, CalendarDays } from "lucide-react-native";

type SlotState = "selected" | "available" | "booked";

interface TimeSlot {
  id: string;
  label: string;
  state: SlotState;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  onSelect: (id: string) => void;
}

interface SlotButtonProps {
  slot: TimeSlot;
  index: number;
  onPress: () => void;
}

function SlotButton({ slot, index, onPress }: SlotButtonProps) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(index * 25),
        Animated.spring(scale, {
          toValue: 1,
          damping: 14,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(index * 25),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index, opacity, scale]);

  const handlePressIn = () => {
    if (slot.state === "booked") return;
    Animated.spring(press, {
      toValue: 0.95,
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

  const disabled = slot.state === "booked";
  const isSelected = slot.state === "selected";
  const containerStyle = {
    transform: [{ scale: Animated.multiply(scale, press) }],
    opacity: disabled ? 0.45 : opacity,
  };

  return (
    <Animated.View
      style={[{ flexBasis: "30%", flexGrow: 0 }, containerStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`relative bg-card rounded-xl border-2 px-3 py-3 items-center justify-center min-h-[72px] ${
          isSelected ? "border-primary" : "border-border"
        }`}
      >
        <View className="mb-1.5">
          {disabled ? (
            <X size={14} color="#9ca3af" strokeWidth={2.4} />
          ) : (
            <Clock4
              size={14}
              color={isSelected ? "#1a5fd4" : "#7a8599"}
              strokeWidth={2.2}
            />
          )}
        </View>

        <Text
          className={`text-[13px] font-bold ${
            disabled ? "text-muted-foreground" : "text-foreground"
          }`}
          numberOfLines={1}
        >
          {slot.label.split(" - ")[0]}
        </Text>
        <Text
          className={`text-[10px] mt-0.5 text-muted-foreground`}
          numberOfLines={1}
        >
          {disabled ? "Đã đặt" : slot.label.split(" - ")[1] ?? ""}
        </Text>

        {isSelected ? (
          <View className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary items-center justify-center">
            <Check size={12} color="#ffffff" strokeWidth={3} />
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TimeSlotGrid({ slots, onSelect }: TimeSlotGridProps) {
  if (slots.length === 0) return null;

  const availableCount = slots.filter((s) => s.state === "available").length;

  return (
    <View className="px-4 mb-6">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-1.5 h-6 rounded-full bg-primary" />
        <Text className="font-bold text-xl text-foreground flex-1">
          Khung giờ trống
        </Text>
        <Text className="text-xs text-muted-foreground">
          {availableCount} khung còn trống
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        {slots.map((slot, index) => (
          <SlotButton
            key={slot.id}
            slot={slot}
            index={index}
            onPress={() => onSelect(slot.id)}
          />
        ))}
      </View>
    </View>
  );
}