import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import HomeHeader from "@/components/HomeHeader";
import PromoBanner from "@/components/PromoBanner";
import MyCarSection from "@/components/MyCarSection";
import FeaturedServiceGrid from "@/components/home/FeaturedServiceGrid";
import ComboSection from "@/components/home/ComboSection";
import CustomerReviews from "@/components/home/CustomerReviews";
import NewsSection from "@/components/home/NewsSection";
import StatsRow from "@/components/StatsRow";
import SectionHeader from "@/components/home/SectionHeader";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { compactName, minutesUntil, toDateInputValue } from "@/lib/format";
import type { Garage, Promotion, ServicePackage, Vehicle } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

export default function HomeScreen() {
  const router = useRouter();
  const { accessToken, authUser, isAuthenticated, profile } = useApp();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState("0");
  const [waitMinutes, setWaitMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHome = async () => {
    try {
      setError(null);
      const [garagesResponse, promotionsResponse, servicesResponse] =
        await Promise.all([
          api.getGarages({ limit: 4 }),
          api.getPromotions({ limit: 5 }),
          api.getServicePackages({ limit: 3 }),
        ]);

      const fetchedGarages = garagesResponse.data ?? [];
      const fetchedServices = servicesResponse.data ?? [];
      setGarages(fetchedGarages);
      setPromotions(promotionsResponse.data ?? []);
      setServices(fetchedServices);

      if (isAuthenticated && accessToken) {
        const [vehiclesResponse, loyaltyResponse] = await Promise.all([
          api.getVehicles(accessToken, { limit: 10, is_active: true }),
          api.getLoyaltySummary(accessToken),
        ]);

        setVehicles(vehiclesResponse.data ?? []);
        setLoyaltyPoints(String(loyaltyResponse.data.loyalty?.available_points ?? 0));
      } else {
        setVehicles([]);
        setLoyaltyPoints("0");
      }

      if (fetchedGarages[0] && fetchedServices[0]) {
        const slotsResponse = await api.getAvailableSlots(
          {
            garage_id: fetchedGarages[0].id,
            service_package_id: fetchedServices[0].id,
            date: toDateInputValue(new Date()),
          },
          accessToken
        );

        const firstSlot =
          slotsResponse.data.days?.[0]?.available_slots?.[0]?.start_time ??
          slotsResponse.data.available_slots?.[0]?.start_time;

        setWaitMinutes(firstSlot ? minutesUntil(firstSlot) : 0);
      } else {
        setWaitMinutes(0);
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể tải dữ liệu trang chủ.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadHome();
  }, [accessToken, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadHome();
    }, [accessToken, isAuthenticated])
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải"
          description="Đang lấy dữ liệu khách hàng và thông tin công khai."
        />
      </SafeAreaView>
    );
  }

  if (error && services.length === 0 && promotions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Không tải được dữ liệu"
          description={error}
          actionLabel="Thử lại"
          onAction={() => {
            setLoading(true);
            void loadHome();
          }}
        />
      </SafeAreaView>
    );
  }

  const primaryPromotion = promotions[0];
  const userName = compactName(profile?.full_name ?? authUser?.full_name, "Khách");
  const primaryCars = vehicles.slice(0, 10).map((vehicle) => ({
    name: `${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim() || vehicle.vehicle_type,
    plate: vehicle.raw_license_plate,
  }));

  const handleServiceSelect = (service: { id: string; name: string }) => {
    router.push({
      pathname: "/service/[id]",
      params: { id: service.id, name: service.name },
    });
  };

  const handleComboSelect = (combo: { id: string; name: string }) => {
    router.push({
      pathname: "/combo/[id]",
      params: { id: combo.id, name: combo.name },
    });
  };

  const handleNewsSelect = (news: { id: string; title: string }) => {
    router.push({
      pathname: "/news/[id]",
      params: { id: news.id, title: news.title },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadHome();
            }}
          />
        }
      >
        <HomeHeader
          userName={userName}
          avatarUrl={profile?.avatar_url ?? authUser?.avatar_url ?? undefined}
          accessToken={accessToken}
          onNotificationPress={() =>
            router.push(isAuthenticated ? "/notifications" : "/login")
          }
        />

        <PromoBanner
          badge={primaryPromotion ? primaryPromotion.code : "ƯU ĐÃI ĐỘC QUYỀN"}
          title={
            primaryPromotion
              ? primaryPromotion.name
              : "Khám phá garage và dịch vụ trước khi đăng nhập"
          }
          subtitle={
            primaryPromotion?.description ??
            "Khách có thể xem garage, giá dịch vụ và khung giờ trống."
          }
          ctaText={isAuthenticated ? "Đặt lịch ngay" : "Đăng nhập"}
          onPress={() =>
            router.push(isAuthenticated ? "/(tabs)/booking" : "/login")
          }
        />

        {/* Xe của tôi */}
        <MyCarSection
          cars={primaryCars}
          isGuest={!isAuthenticated}
          onViewAll={() =>
            router.push(isAuthenticated ? "/my-vehicles" : "/login")
          }
          onCarPress={() => router.push("/my-vehicles")}
          onAddCar={() => router.push(isAuthenticated ? "/my-vehicles" : "/login")}
        />
        {/* Dịch vụ nổi bật */}
        <FeaturedServiceGrid onSelect={handleServiceSelect} />

        {/* Combo đặc biệt */}
        <ComboSection onSelect={handleComboSelect} />

        {/* Đánh giá khách hàng */}
        <CustomerReviews />

        {/* Tin tức & Sự kiện */}
        <NewsSection onSelect={handleNewsSelect} />

        

        {/* Stats Row */}
        <View className="px-4 mt-5">
          <SectionHeader title="Hoạt động của bạn" />
        </View>
        <StatsRow
          waitMinutes={waitMinutes}
          loyaltyPoints={loyaltyPoints}
          pointsLabel={isAuthenticated ? "Điểm tích lũy" : "Đăng nhập để tích điểm"}
          waitLabel={garages[0] ? `Phút chờ tại ${garages[0].district ?? "garage gần nhất"}` : "Phút chờ ước tính"}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
