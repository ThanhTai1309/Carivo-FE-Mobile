import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
  CarFront,
  Clock,
  Heart,
  MapPin,
  Phone,
  Star,
  ThumbsUp,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReviewSummaryCard from "@/components/reviews/ReviewSummaryCard";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type {
  Garage,
  GarageReview,
  ReviewSummary,
  ServicePackage,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function openMap(garage: Garage) {
  if (typeof garage.latitude !== "number" || typeof garage.longitude !== "number") {
    return;
  }
  const url = `https://www.google.com/maps/search/?api=1&query=${garage.latitude},${garage.longitude}`;
  Linking.openURL(url).catch(() => {
    // ignore
  });
}

export default function GarageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { accessToken, isAuthenticated } = useApp();
  const garageId = params.id;

  const [garage, setGarage] = useState<Garage | null>(null);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    rating_average: 0,
    rating_count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadData = useCallback(async () => {
    if (!garageId) return;
    try {
      const [
        garageResponse,
        servicesResponse,
        reviewsResponse,
        summaryResponse,
      ] =
        await Promise.all([
          api.getGarage(garageId),
          api.getServicePackages({
            garage_id: garageId,
            limit: 50,
          }),
          api.getGarageReviews(garageId, { limit: 20, sort: "NEWEST" }),
          api.getGarageReviewSummary(garageId).catch(() => null),
        ]);
      setGarage(garageResponse.data);
      setServices(servicesResponse.data ?? []);
      setReviews(reviewsResponse.data ?? []);
      if (summaryResponse?.data) {
        setSummary(summaryResponse.data);
      } else {
        setSummary((current) => ({
          ...current,
          rating_average: garageResponse.data.rating_average ?? 0,
          rating_count:
            garageResponse.data.rating_count ?? reviewsResponse.data?.length ?? 0,
        }));
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể tải thông tin garage.";
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [garageId]);

  const loadFavorite = useCallback(async () => {
    if (!accessToken || !garageId) {
      setIsFavorite(false);
      return;
    }
    try {
      const favs = await api.getFavoriteGarages(accessToken);
      const list = favs.data ?? [];
      setIsFavorite(list.some((f) => f.garage_id === garageId));
    } catch {
      // ignore — keep false
    }
  }, [accessToken, garageId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadFavorite();
    }
  }, [isAuthenticated, loadFavorite]);

  const handleToggleFavorite = async () => {
    if (!accessToken || !garageId) {
      Alert.alert("Đăng nhập", "Vui lòng đăng nhập để lưu garage yêu thích.", [
        { text: "Để sau", style: "cancel" },
        { text: "Đăng nhập", onPress: () => router.push("/login") },
      ]);
      return;
    }
    setFavoriteBusy(true);
    try {
      const response = await api.toggleGarageFavorite(accessToken, garageId);
      setIsFavorite(response.data?.favorited ?? false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể cập nhật yêu thích.";
      Alert.alert("Lỗi", message);
    } finally {
      setFavoriteBusy(false);
    }
  };

  const rating = summary.rating_average || garage?.rating_average || 0;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải garage" />
      </SafeAreaView>
    );
  }

  if (!garage) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 pt-4 pb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
        <ScreenState
          title="Garage không tồn tại"
          description="Liên kết có thể đã hết hạn hoặc garage đã bị xoá."
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
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3 justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleToggleFavorite()}
            disabled={favoriteBusy}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            {favoriteBusy ? (
              <ActivityIndicator size="small" color="#1a5fd4" />
            ) : (
              <Heart
                size={20}
                color={isFavorite ? "#ef4444" : "#1a1a1a"}
                strokeWidth={2.2}
                fill={isFavorite ? "#ef4444" : "transparent"}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Cover */}
        {garage.cover_image_url || garage.image_url ? (
          <Image
            source={{ uri: garage.cover_image_url ?? garage.image_url ?? "" }}
            className="w-full"
            style={{ height: 200 }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full bg-secondary items-center justify-center"
            style={{ height: 200 }}
          >
            <CarFront size={48} color="#1a5fd4" strokeWidth={1.4} />
          </View>
        )}

        <View className="px-4 mt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {garage.name}
              </Text>
              {garage.garage_code ? (
                <Text className="text-xs text-muted-foreground tracking-wider mt-1">
                  Mã: {garage.garage_code}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center gap-3 mt-3 flex-wrap">
            <View className="flex-row items-center gap-1 bg-secondary px-2.5 py-1 rounded-full">
              <Star
                size={14}
                color="#f59e0b"
                strokeWidth={2.4}
                fill="#f59e0b"
              />
              <Text className="text-xs font-bold text-foreground">
                {rating.toFixed(1)}
              </Text>
              <Text className="text-[11px] text-muted-foreground">
                ({summary.rating_count})
              </Text>
            </View>
          </View>

          {garage.description ? (
            <Text className="text-sm text-foreground mt-3 leading-relaxed">
              {garage.description}
            </Text>
          ) : null}

          {/* Quick info */}
          <View className="mt-4 rounded-2xl bg-card border border-border p-4 gap-3">
            {garage.address ? (
              <TouchableOpacity
                onPress={() => openMap(garage)}
                className="flex-row items-center gap-3"
              >
                <View className="w-10 h-10 rounded-lg bg-secondary items-center justify-center">
                  <MapPin size={18} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Địa chỉ
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {garage.address}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    {[garage.ward, garage.district, garage.city]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {garage.phone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${garage.phone}`)}
                className="flex-row items-center gap-3"
              >
                <View className="w-10 h-10 rounded-lg bg-secondary items-center justify-center">
                  <Phone size={18} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Hotline
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {garage.phone}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {garage.opening_time || garage.closing_time ? (
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-lg bg-secondary items-center justify-center">
                  <Clock size={18} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Giờ mở cửa
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {garage.opening_time ?? "?"} - {garage.closing_time ?? "?"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Services */}
          <View className="mt-5">
            <View className="flex-row items-center gap-2 mb-3">
              <CarFront size={18} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-base font-bold text-foreground">
                Dịch vụ khả dụng
              </Text>
            </View>
            {services.length === 0 ? (
              <View className="rounded-2xl border border-dashed border-border bg-card p-4 items-center">
                <Text className="text-xs text-muted-foreground">
                  Garage chưa công bố dịch vụ khả dụng.
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {services
                  .filter((s) => s.service_type !== "ADDON")
                  .map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() =>
                        router.push({
                          pathname: "/service/[id]",
                          params: {
                            id: service.id,
                          },
                        })
                      }
                      className="rounded-2xl bg-card border border-border p-4 flex-row items-center gap-3"
                    >
                      <View className="w-12 h-12 rounded-xl bg-secondary items-center justify-center">
                        <CarFront size={20} color="#1a5fd4" strokeWidth={2.2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground">
                          {service.name}
                        </Text>
                        {service.description ? (
                          <Text
                            className="text-xs text-muted-foreground mt-0.5"
                            numberOfLines={2}
                          >
                            {service.description}
                          </Text>
                        ) : null}
                        <View className="flex-row items-center gap-3 mt-1.5">
                          <Text className="text-sm font-bold text-primary">
                            {formatCurrency(service.base_price)}
                          </Text>
                          {service.duration_minutes ? (
                            <Text className="text-[11px] text-muted-foreground">
                              ~{service.duration_minutes} phút
                            </Text>
                          ) : null}
                          {typeof service.rating_average === "number" ? (
                            <View className="flex-row items-center gap-1">
                              <Star
                                size={11}
                                color="#f59e0b"
                                fill="#f59e0b"
                                strokeWidth={1.8}
                              />
                              <Text className="text-[11px] text-muted-foreground">
                                {service.rating_average.toFixed(1)} (
                                {service.rating_count ?? 0})
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          {/* Reviews */}
          <View className="mt-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <ThumbsUp size={18} color="#1a5fd4" strokeWidth={2.2} />
                <Text className="text-base font-bold text-foreground">
                  Đánh giá từ khách hàng
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                {summary.rating_count} đánh giá
              </Text>
            </View>
            <ReviewSummaryCard
              summary={summary}
              title="Điểm chất lượng garage"
            />
            {reviews.length === 0 ? (
              <View className="mt-3 rounded-2xl border border-dashed border-border bg-card p-4 items-center gap-2">
                <Star size={22} color="#94a3b8" strokeWidth={1.6} />
                <Text className="text-xs text-muted-foreground text-center">
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá dịch vụ của
                  garage này sau khi rửa xe.
                </Text>
              </View>
            ) : (
              <View className="mt-3 gap-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Book CTA */}
      <View className="absolute left-0 right-0 bottom-0 px-4 py-4 bg-background border-t border-border">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/booking",
              params: { garageId: garage.id },
            })
          }
          activeOpacity={0.85}
          className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{
            shadowColor: "#1a5fd4",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.28,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text className="text-white font-bold text-base">
            Đặt lịch tại garage này
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
