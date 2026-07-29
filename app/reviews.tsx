import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, MessageSquareText, Star } from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import ReviewCard from "@/components/reviews/ReviewCard";
import { api } from "@/lib/api";
import { getReviewErrorMessage } from "@/lib/review";
import type { GarageReview } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

export default function MyReviewsScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await api.getMyReviews(accessToken, {
          page: 1,
          limit: 100,
        });
        setReviews(response.data ?? []);
      } catch (error) {
        Alert.alert("Không thể tải đánh giá", getReviewErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      if (isHydrated && isAuthenticated) {
        void load();
      }
    }, [isAuthenticated, isHydrated, load])
  );

  const stats = useMemo(() => {
    const active = reviews.filter((review) => !review.deleted_at);
    const average =
      active.length > 0
        ? active.reduce(
            (sum, review) =>
              sum + (review.garage_rating + review.service_rating) / 2,
            0
          ) / active.length
        : 0;
    return {
      total: active.length,
      average,
      replied: active.filter((review) => Boolean(review.garage_reply)).length,
    };
  }, [reviews]);

  if (!isHydrated || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải đánh giá" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Cần đăng nhập"
          description="Đăng nhập để xem và quản lý đánh giá của bạn."
          actionLabel="Đăng nhập"
          onAction={() => router.replace("/login")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
        >
          <ArrowLeft size={20} color="#111827" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            Đánh giá của tôi
          </Text>
          <Text className="text-xs text-muted-foreground">
            Quản lý trải nghiệm bạn đã chia sẻ
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
      >
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-blue-50 p-3">
            <MessageSquareText size={17} color="#1d4ed8" strokeWidth={2.2} />
            <Text className="mt-2 text-xl font-bold text-blue-900">
              {stats.total}
            </Text>
            <Text className="text-[11px] text-blue-700">Đánh giá</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-amber-50 p-3">
            <Star
              size={17}
              color="#d97706"
              fill="#d97706"
              strokeWidth={2.2}
            />
            <Text className="mt-2 text-xl font-bold text-amber-900">
              {stats.average.toFixed(1)}
            </Text>
            <Text className="text-[11px] text-amber-700">Điểm trung bình</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-emerald-50 p-3">
            <MessageSquareText
              size={17}
              color="#047857"
              strokeWidth={2.2}
            />
            <Text className="mt-2 text-xl font-bold text-emerald-900">
              {stats.replied}
            </Text>
            <Text className="text-[11px] text-emerald-700">Đã phản hồi</Text>
          </View>
        </View>

        {reviews.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border bg-card p-7">
            <Star size={28} color="#94a3b8" strokeWidth={1.8} />
            <Text className="mt-3 text-base font-bold text-foreground">
              Chưa có đánh giá
            </Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Sau khi hoàn thành và thanh toán booking, bạn có thể đánh giá tại
              màn hình chi tiết booking.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showSubject
                showModeration
                onPress={
                  review.booking_id
                    ? () =>
                        router.push({
                          pathname: "/review/[bookingId]",
                          params: { bookingId: review.booking_id! },
                        })
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
