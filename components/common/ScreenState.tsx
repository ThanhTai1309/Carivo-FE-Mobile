import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import type { ReactNode } from "react";

interface ScreenStateProps {
  actionLabel?: string;
  description?: string;
  icon?: ReactNode;
  loading?: boolean;
  onAction?: () => void;
  title: string;
}

export default function ScreenState({
  actionLabel,
  description,
  icon,
  loading = false,
  onAction,
  title,
}: ScreenStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#1a5fd4" />
          <Text className="text-sm text-muted-foreground mt-3">{title}</Text>
        </>
      ) : (
        <>
          {icon ? <View className="mb-3">{icon}</View> : null}
          <Text className="text-2xl font-bold text-foreground text-center">
            {title}
          </Text>
          {description ? (
            <Text className="text-sm text-muted-foreground text-center mt-3 leading-6">
              {description}
            </Text>
          ) : null}
          {actionLabel && onAction ? (
            <TouchableOpacity
              onPress={onAction}
              className="mt-6 rounded-xl bg-primary px-5 py-3"
            >
              <Text className="text-white font-semibold">{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}
