import { Star } from "lucide-react-native";
import { Text, View } from "react-native";
import type { ReviewSummary } from "@/lib/types";
import RatingStars from "@/components/reviews/RatingStars";

export default function ReviewSummaryCard({
  summary,
  title,
}: {
  summary: ReviewSummary;
  title: string;
}) {
  const maxCount = Math.max(summary.rating_count, 1);

  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <Text className="text-sm font-bold text-foreground">{title}</Text>
      <View className="mt-3 flex-row items-center gap-5">
        <View className="items-center">
          <Text className="text-3xl font-bold text-foreground">
            {summary.rating_average.toFixed(1)}
          </Text>
          <RatingStars value={Math.round(summary.rating_average)} size={14} />
          <Text className="mt-1 text-[11px] text-muted-foreground">
            {summary.rating_count} lượt đánh giá
          </Text>
        </View>
        <View className="flex-1 gap-1.5">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              summary.distribution[rating as 1 | 2 | 3 | 4 | 5] ?? 0;
            const width =
              `${Math.round((count / maxCount) * 100)}%` as `${number}%`;
            return (
              <View key={rating} className="flex-row items-center gap-2">
                <Text className="w-3 text-[11px] text-muted-foreground">
                  {rating}
                </Text>
                <Star
                  size={10}
                  color="#f59e0b"
                  fill="#f59e0b"
                  strokeWidth={1.8}
                />
                <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <View
                    className="h-full rounded-full bg-amber-400"
                    style={{ width }}
                  />
                </View>
                <Text className="w-6 text-right text-[10px] text-muted-foreground">
                  {count}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
