import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  Sparkles,
  Star,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReviewSummaryCard from "@/components/reviews/ReviewSummaryCard";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  GarageReview,
  ReviewSort,
  ReviewSummary,
  ServicePackage,
} from "@/lib/types";

const SORT_OPTIONS: Array<{ value: ReviewSort; label: string }> = [
  { value: "NEWEST", label: "Mới nhất" },
  { value: "HIGHEST", label: "Điểm cao" },
  { value: "LOWEST", label: "Điểm thấp" },
];

const EMPTY_SUMMARY: ReviewSummary = {
  rating_average: 0,
  rating_count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export default function ServiceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const serviceId = params.id;
  const [service, setService] = useState<ServicePackage | null>(null);
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);
  const [sort, setSort] = useState<ReviewSort>("NEWEST");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!serviceId) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [serviceResponse, reviewsResponse, summaryResponse] =
          await Promise.all([
            api.getServicePackage(serviceId),
            api.getServicePackageReviews(serviceId, {
              page: 1,
              limit: 50,
              sort,
            }),
            api.getServicePackageReviewSummary(serviceId),
          ]);
        setService(serviceResponse.data);
        setReviews(reviewsResponse.data ?? []);
        setSummary(summaryResponse.data ?? EMPTY_SUMMARY);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Không thể tải thông tin dịch vụ.";
        Alert.alert("Lỗi", message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [serviceId, sort]
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải dịch vụ" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Không tìm thấy dịch vụ"
          description="Dịch vụ có thể đã ngừng hoạt động hoặc liên kết không còn hợp lệ."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
      >
        <View className="flex-row items-center gap-3 px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <ArrowLeft size={20} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-bold text-foreground">
            Chi tiết dịch vụ
          </Text>
        </View>

        {service.image_url ? (
          <Image
            source={{ uri: service.image_url }}
            className="mx-4 h-52 rounded-2xl bg-secondary"
            resizeMode="cover"
          />
        ) : (
          <View className="mx-4 h-44 items-center justify-center rounded-2xl bg-secondary">
            <Sparkles size={54} color="#1a5fd4" strokeWidth={1.5} />
          </View>
        )}

        <View className="px-4 pt-5">
          <Text className="text-2xl font-bold text-foreground">
            {service.name}
          </Text>
          {service.description ? (
            <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {service.description}
            </Text>
          ) : null}

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-border bg-card p-4">
              <Text className="text-xs text-muted-foreground">Giá từ</Text>
              <Text className="mt-1 text-xl font-bold text-primary">
                {formatCurrency(service.base_price)}
              </Text>
            </View>
            <View className="flex-1 rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-2">
                <Clock size={15} color="#64748b" strokeWidth={2.1} />
                <Text className="text-xs text-muted-foreground">
                  Thời lượng
                </Text>
              </View>
              <Text className="mt-1 text-xl font-bold text-foreground">
                {service.duration_minutes} phút
              </Text>
            </View>
          </View>

          <View className="mt-5">
            <ReviewSummaryCard
              summary={summary}
              title="Điểm chất lượng dịch vụ"
            />
          </View>

          <View className="mt-5 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Star
                size={18}
                color="#f59e0b"
                fill="#f59e0b"
                strokeWidth={2}
              />
              <Text className="text-base font-bold text-foreground">
                Bình luận công khai
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              {summary.rating_count} đánh giá
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {SORT_OPTIONS.map((option) => {
              const active = option.value === sort;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setSort(option.value)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? "border-primary bg-secondary"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {reviews.length === 0 ? (
            <View className="mt-3 items-center rounded-2xl border border-dashed border-border bg-card p-5">
              <Star size={24} color="#94a3b8" strokeWidth={1.7} />
              <Text className="mt-2 text-center text-sm text-muted-foreground">
                Chưa có đánh giá công khai cho dịch vụ này.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} showSubject />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/booking",
              params: { servicePackageId: service.id },
            })
          }
          activeOpacity={0.85}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4"
        >
          <CalendarPlus size={19} color="#ffffff" strokeWidth={2.3} />
          <Text className="text-base font-bold text-white">Đặt dịch vụ này</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
