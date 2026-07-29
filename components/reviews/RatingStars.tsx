import { Star } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  showValue?: boolean;
  disabled?: boolean;
}

export default function RatingStars({
  value,
  onChange,
  size = 20,
  showValue = false,
  disabled = false,
}: RatingStarsProps) {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = rating <= value;
        return (
          <TouchableOpacity
            key={rating}
            disabled={disabled || !onChange}
            onPress={() => onChange?.(rating)}
            accessibilityRole={onChange ? "button" : undefined}
            accessibilityLabel={`${rating} sao`}
            className={onChange ? "p-1" : ""}
          >
            <Star
              size={size}
              color={active ? "#f59e0b" : "#cbd5e1"}
              fill={active ? "#f59e0b" : "transparent"}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
        );
      })}
      {showValue ? (
        <Text className="ml-1 text-sm font-bold text-foreground">
          {value.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}
