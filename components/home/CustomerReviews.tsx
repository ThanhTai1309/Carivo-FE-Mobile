import { ChevronRight, MessageSquareText } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ReviewCard from "@/components/reviews/ReviewCard";
import type { GarageReview } from "@/lib/types";

export default function CustomerReviews({
  reviews,
  onSelect,
}: {
  reviews: GarageReview[];
  onSelect?: (review: GarageReview) => void;
}) {
  return (
    <View className="mt-8">
      <View className="mb-4 flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-1.5 rounded-full bg-amber-500" />
          <Text className="text-xl font-bold text-foreground">
            Đánh giá khách hàng
          </Text>
        </View>
      </View>

      {reviews.length === 0 ? (
        <View className="mx-4 items-center rounded-2xl border border-dashed border-border bg-card p-5">
          <MessageSquareText size={24} color="#94a3b8" strokeWidth={1.8} />
          <Text className="mt-2 text-sm font-semibold text-foreground">
            Chưa có đánh giá công khai
          </Text>
          <Text className="mt-1 text-center text-xs text-muted-foreground">
            Bình luận đã xác minh từ booking hoàn thành sẽ xuất hiện tại đây.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 16,
            paddingRight: 16,
            gap: 12,
          }}
        >
          {reviews.map((review) => (
            <View key={review.id} style={{ width: 320 }}>
              <ReviewCard
                review={review}
                showSubject
                onPress={onSelect ? () => onSelect(review) : undefined}
              />
              {onSelect ? (
                <TouchableOpacity
                  onPress={() => onSelect(review)}
                  className="mt-2 flex-row items-center justify-end gap-1 px-2"
                >
                  <Text className="text-xs font-semibold text-primary">
                    Xem garage
                  </Text>
                  <ChevronRight
                    size={13}
                    color="#1a5fd4"
                    strokeWidth={2.4}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
