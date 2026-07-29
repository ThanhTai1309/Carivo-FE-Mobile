import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  Check,
  CheckSquare,
  ExternalLink,
  HelpCircle,
} from "lucide-react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import StepIndicator from "@/components/booking/StepIndicator";
import GarageCard from "@/components/booking/GarageCard";
import VehicleSelector from "@/components/booking/VehicleSelector";
import DateStrip from "@/components/booking/DateStrip";
import TimeSlotGrid from "@/components/booking/TimeSlotGrid";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import { addDays, formatCurrency, toDateInputValue } from "@/lib/format";
import type {
  AvailableSlot,
  Garage,
  PriceQuote,
  ServicePackage,
  Vehicle,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function toVehicleName(vehicle: Vehicle) {
  return `${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim() || vehicle.vehicle_type;
}

function toMinutes(value: string | null | undefined, fallback: number) {
  const [hours, minutes] = String(value ?? "").split(":").map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return fallback;
  }
  return hours * 60 + minutes;
}

function toClockLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toSlotClock(value: string) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getUnavailableSlotLabel(slot: AvailableSlot) {
  const reasons = slot.unavailable_reasons ?? [];
  if (reasons.includes("VEHICLE_BOOKING_OVERLAP")) {
    return "Xe đã có lịch";
  }
  if (reasons.includes("WASH_BAY_CAPACITY_FULL")) {
    return "Hết khoang rửa";
  }
  if (reasons.includes("CARE_STAFF_CAPACITY_FULL")) {
    return "Hết nhân sự";
  }
  return "Không khả dụng";
}

type StepState = "done" | "active" | "inactive";

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    garageId?: string;
    servicePackageId?: string;
    vehicleId?: string;
  }>();
  const incomingServiceId = params.servicePackageId ?? "";
  const incomingGarageId = params.garageId ?? "";
  const incomingVehicleId = params.vehicleId ?? "";
  const { accessToken, isAuthenticated, isHydrated } = useApp();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedGarageId, setSelectedGarageId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState(incomingServiceId);
  const [addOnServiceIds, setAddOnServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotReloadKey, setSlotReloadKey] = useState(0);
  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(new Date(), index);
        return {
          dayLabel: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date),
          date: Number(new Intl.DateTimeFormat("vi-VN", { day: "2-digit" }).format(date)),
          monthLabel: new Intl.DateTimeFormat("vi-VN", { month: "2-digit" }).format(date),
          dateKey: toDateInputValue(date),
          isToday: index === 0,
        };
      }),
    []
  );

  const selectedGarage = garages.find((garage) => garage.id === selectedGarageId);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  const mainServices = useMemo(
    () => services.filter((s) => s.service_type === "WASH"),
    [services]
  );

  const availableAddOns = useMemo(() => {
    const pool = services.filter((s) => s.service_type === "ADDON");
    if (!selectedVehicle) return pool;
    return pool.filter((s) => s.vehicle_type === selectedVehicle.vehicle_type);
  }, [services, selectedVehicle]);

  const compatibleMainServices = useMemo(() => {
    if (!selectedVehicle) return mainServices;
    return mainServices.filter((s) => s.vehicle_type === selectedVehicle.vehicle_type);
  }, [mainServices, selectedVehicle]);

  const selectedService = services.find((service) => service.id === selectedServiceId);
  const availabilityReady = Boolean(
    selectedGarageId &&
      selectedServiceId &&
      (!isAuthenticated || selectedVehicleId)
  );
  const referenceSlotItems = useMemo(() => {
    const sourceGarages = selectedGarage ? [selectedGarage] : garages;
    const openingCandidates = sourceGarages.map((garage) =>
      toMinutes(garage.opening_time, 7 * 60)
    );
    const closingCandidates = sourceGarages.map((garage) =>
      toMinutes(garage.closing_time, 18 * 60)
    );
    const openingMinutes =
      openingCandidates.length > 0 ? Math.min(...openingCandidates) : 7 * 60;
    const closingMinutes =
      closingCandidates.length > 0 ? Math.max(...closingCandidates) : 18 * 60;
    const intervalMinutes = selectedGarage?.slot_interval_minutes ?? 30;
    const items = [];

    for (
      let current = openingMinutes;
      current < closingMinutes;
      current += intervalMinutes
    ) {
      const label = toClockLabel(current);
      items.push({
        id: `preview-${selectedDate}-${label}`,
        label,
        detail: "Chưa kiểm tra",
        state: "preview" as const,
        raw: null as AvailableSlot | null,
      });
    }

    return items;
  }, [garages, selectedDate, selectedGarage]);

  const loadBootData = useCallback(async () => {
    try {
      setError(null);
      const [garagesResponse, servicesResponse] = await Promise.all([
        api.getGarages({ limit: 10 }),
        api.getServicePackages({ limit: 50 }),
      ]);

      const garageData = garagesResponse.data ?? [];
      const serviceData = servicesResponse.data ?? [];
      setGarages(garageData);
      setServices(serviceData);
      setSelectedGarageId((current) => {
        if (incomingGarageId && garageData.some((g) => g.id === incomingGarageId)) {
          return incomingGarageId;
        }
        return current;
      });

      if (isAuthenticated && accessToken) {
        const vehiclesResponse = await api.getVehicles(accessToken, {
          limit: 20,
          is_active: true,
        });
        const vehicleData = vehiclesResponse.data ?? [];
        setVehicles(vehicleData);
        setSelectedVehicleId((current) => {
          if (
            incomingVehicleId &&
            vehicleData.some((v) => v.id === incomingVehicleId)
          ) {
            return incomingVehicleId;
          }
          if (current && vehicleData.some((v) => v.id === current)) {
            return current;
          }
          return (
            vehicleData.find((vehicle) => vehicle.is_default)?.id ??
            (vehicleData.length === 1 ? vehicleData[0]?.id ?? "" : "")
          );
        });
      } else {
        setVehicles([]);
        setSelectedVehicleId("");
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Không thể tải dữ liệu đặt lịch.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    incomingGarageId,
    incomingVehicleId,
    isAuthenticated,
  ]);

  useFocusEffect(
    useCallback(() => {
      void loadBootData();
    }, [loadBootData])
  );

  // Khi đổi xe: nếu service chính / add-ons không phù hợp → clear
  useEffect(() => {
    if (!selectedVehicle) {
      setSelectedServiceId((current) => {
        if (current && services.find((s) => s.id === current)?.service_type !== "WASH") {
          return incomingServiceId;
        }
        return current;
      });
      setAddOnServiceIds((current) =>
        current.filter((id) => services.some((s) => s.id === id))
      );
      return;
    }

    if (
      selectedServiceId &&
      selectedService &&
      selectedService.vehicle_type !== selectedVehicle.vehicle_type
    ) {
      setSelectedServiceId("");
    }

    setAddOnServiceIds((current) =>
      current.filter((id) => {
        const s = services.find((item) => item.id === id);
        return s && s.vehicle_type === selectedVehicle.vehicle_type;
      })
    );
  }, [selectedVehicle?.vehicle_type, selectedVehicleId]);

  // Fetch available slots
  useEffect(() => {
    let cancelled = false;

    const fetchSlots = async () => {
      if (!availabilityReady) {
        setSlots([]);
        setSlotsLoading(false);
        setAvailabilityChecked(false);
        setSlotError(null);
        setSelectedSlot(null);
        return;
      }

      setSlotsLoading(true);
      setAvailabilityChecked(false);
      setSlotError(null);
      setSelectedSlot(null);
      try {
        const response = await api.getAvailableSlots(
          {
            garage_id: selectedGarageId,
            service_package_id: selectedServiceId,
            vehicle_id: selectedVehicleId || undefined,
            add_on_service_ids:
              addOnServiceIds.length > 0 ? addOnServiceIds : undefined,
            date: selectedDate,
          },
          accessToken
        );

        if (cancelled) return;
        const nextSlots =
          response.data.days?.[0]?.slots ??
          response.data.slots ??
          response.data.days?.[0]?.available_slots ??
          response.data.available_slots ??
          [];
        setSlots(nextSlots);
        setAvailabilityChecked(true);
      } catch (error) {
        if (cancelled) return;
        setSlots([]);
        const message =
          error instanceof ApiError ? error.message : "Không thể tải khung giờ.";
        setSlotError(message);
        setAvailabilityChecked(false);
      } finally {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      }
    };

    void fetchSlots();

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    availabilityReady,
    selectedDate,
    selectedGarageId,
    selectedServiceId,
    selectedVehicleId,
    addOnServiceIds,
    slotReloadKey,
  ]);

  useEffect(() => {
    if (
      !accessToken ||
      !selectedGarageId ||
      !selectedVehicleId ||
      !selectedServiceId
    ) {
      setPriceQuote(null);
      setQuoteLoading(false);
      setQuoteError(null);
      return;
    }

    setPriceQuote(null);
    setQuoteLoading(true);
    setQuoteError(null);

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.createPriceQuote(accessToken, {
          garage_id: selectedGarageId,
          vehicle_id: selectedVehicleId,
          service_package_id: selectedServiceId,
          add_on_service_ids:
            addOnServiceIds.length > 0 ? addOnServiceIds : undefined,
          effective_at: selectedSlot?.start_time,
        });
        if (!cancelled) {
          setPriceQuote(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setPriceQuote(null);
          setQuoteError(
            error instanceof ApiError
              ? error.message
              : "Không có bảng giá phù hợp với phân loại xe này."
          );
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    accessToken,
    selectedGarageId,
    selectedVehicleId,
    selectedServiceId,
    addOnServiceIds,
    selectedSlot?.start_time,
  ]);

  const handleJoinWaitlist = useCallback(async () => {
    if (!accessToken) {
      router.push("/login");
      return;
    }
    if (
      !selectedGarageId ||
      !selectedServiceId ||
      !selectedVehicleId
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng chọn garage, phương tiện và dịch vụ trước khi vào danh sách chờ."
      );
      return;
    }
    router.push({
      pathname: "/waitlist/new",
      params: {
        garageId: selectedGarageId,
        servicePackageId: selectedServiceId,
        vehicleId: selectedVehicleId,
      },
    });
  }, [
    accessToken,
    router,
    selectedGarageId,
    selectedServiceId,
    selectedVehicleId,
  ]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải lịch"
          description="Đang lấy garage, dịch vụ và phương tiện."
        />
      </SafeAreaView>
    );
  }

  if (error && garages.length === 0 && services.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Không thể tải lịch"
          description={error}
          actionLabel="Thử lại"
          onAction={() => {
            setLoading(true);
            void loadBootData();
          }}
        />
      </SafeAreaView>
    );
  }

  const resolvedSlotItems = slots.map((slot) => ({
    id: slot.start_time,
    label: toSlotClock(slot.start_time),
    detail: slot.is_available
      ? `đến ${toSlotClock(slot.end_time)}`
      : getUnavailableSlotLabel(slot),
    state:
      selectedSlot?.start_time === slot.start_time
        ? ("selected" as const)
        : slot.is_available
          ? ("available" as const)
          : ("unavailable" as const),
    raw: slot as AvailableSlot | null,
  }));
  const resolvedSlotsByLabel = new Map(
    resolvedSlotItems.map((item) => [item.label, item])
  );
  const referenceLabels = new Set(referenceSlotItems.map((item) => item.label));
  const fullResolvedSlotItems = [
    ...referenceSlotItems.map(
      (item) =>
        resolvedSlotsByLabel.get(item.label) ?? {
          ...item,
          detail: "Không khả dụng",
          state: "unavailable" as const,
        }
    ),
    ...resolvedSlotItems.filter((item) => !referenceLabels.has(item.label)),
  ];
  const slotItems = availabilityChecked
    ? fullResolvedSlotItems
    : referenceSlotItems;
  const availableSlotCount = slotItems.filter(
    (item) => item.state === "available" || item.state === "selected"
  ).length;
  const scheduleHint = slotsLoading
    ? "Đang kiểm tra khả năng phục vụ theo lựa chọn của bạn."
    : slotError
      ? slotError
      : availabilityChecked
        ? "Các giờ làm mờ hiện không thể đáp ứng đầy đủ dịch vụ đã chọn."
        : !selectedGarage
          ? "Chọn garage để áp dụng giờ hoạt động chính xác."
          : isAuthenticated && !selectedVehicle
            ? "Chọn hoặc thêm phương tiện để kiểm tra lịch phù hợp."
            : !selectedService
              ? "Chọn dịch vụ để kiểm tra các khung giờ còn khả dụng."
              : "Đang chờ đủ thông tin để kiểm tra lịch.";

  const totalPrice = priceQuote?.subtotal ?? 0;
  const canContinue = Boolean(
    selectedGarage &&
      selectedService &&
      selectedSlot &&
      priceQuote &&
      !quoteLoading
  );
  const quotedPriceByServiceId = new Map(
    (priceQuote?.items ?? []).map((item) => [
      item.service_package_id,
      item.price_snapshot,
    ])
  );

  const handleToggleAddOn = (id: string) => {
    setAddOnServiceIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const step1: StepState = selectedGarage ? "done" : "active";
  // Bước 2: Phương tiện — chỉ yêu cầu nếu user đã auth
  const step2: StepState = !selectedGarage
    ? "inactive"
    : !isAuthenticated
      ? "inactive"
      : selectedVehicle
        ? "done"
        : "active";
  // Bước 3: Dịch vụ — cần garage + (vehicle nếu auth)
  const step3: StepState = !selectedGarage
    ? "inactive"
    : isAuthenticated && !selectedVehicle
      ? "inactive"
      : selectedService
        ? "done"
        : "active";
  // Bước 4: Thời gian — cần đủ các bước trên
  const step4: StepState = !selectedGarage ||
    (isAuthenticated && !selectedVehicle) ||
    !selectedService
    ? "inactive"
    : selectedSlot
      ? "done"
      : "active";

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View
        className="flex-row items-center justify-between px-4 pt-3 pb-2 bg-background"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full items-center justify-center bg-card"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.4} />
          </TouchableOpacity>
          <View>
            <Text className="text-base font-extrabold text-foreground">
              Đặt lịch rửa xe
            </Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              Hoàn tất các bước để giữ chỗ
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Cách dùng",
              "Khách có thể xem garage, dịch vụ và khung giờ. Đăng nhập customer để xác nhận booking."
            )
          }
          className="w-9 h-9 rounded-full border border-border items-center justify-center bg-card"
        >
          <HelpCircle size={18} color="#1a1a1a" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <StepIndicator
        step1={step1}
        step2={step2}
        step3={step3}
        step4={step4}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* 1. Chọn garage */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-6 rounded-full bg-primary" />
            <Text className="font-bold text-xl text-foreground flex-1">
              Chọn garage
            </Text>
            {selectedGarage ? (
              <TouchableOpacity
                onPress={() => setSelectedGarageId("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-primary text-sm font-medium">
                  Thay đổi
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-xs text-muted-foreground">
                {garages.length} địa điểm
              </Text>
            )}
          </View>

          <View className="gap-3">
            {garages.map((garage, garageIndex) => (
              <View key={garage.id} className="gap-1.5">
                <GarageCard
                  index={garageIndex}
                  name={garage.name}
                  distance={garage.address ?? "Xem chi tiết tại hồ sơ garage"}
                  rating={
                    garage.rating_average
                      ? `${garage.rating_average.toFixed(1)} (${garage.rating_count ?? 0} đánh giá)`
                      : "Garage công khai"
                  }
                  imageUrl={
                    garage.cover_image_url ??
                    garage.image_url ??
                    "https://storage.googleapis.com/banani-generated-images/generated-images/f22f33ae-2e14-4995-a422-0101ae3bdda3.jpg"
                  }
                  badge={garage.id === selectedGarageId ? "Đã chọn" : undefined}
                  selected={garage.id === selectedGarageId}
                  onPress={() => setSelectedGarageId(garage.id)}
                />
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/garage/[id]",
                      params: { id: garage.id },
                    })
                  }
                  className="self-start flex-row items-center gap-1 px-2 py-1"
                >
                  <ExternalLink size={12} color="#1a5fd4" strokeWidth={2.4} />
                  <Text className="text-xs text-primary font-semibold">
                    Xem chi tiết garage
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Chọn phương tiện */}
        {isAuthenticated ? (
          <VehicleSelector
            vehicles={vehicles.map((vehicle) => ({
              id: vehicle.id,
              icon: vehicle.vehicle_type === "CAR" ? Car : Bike,
              name: toVehicleName(vehicle),
              plate: vehicle.raw_license_plate,
            }))}
            selectedId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            onAdd={() => router.push("/vehicle-form")}
          />
        ) : (
          <View className="px-4 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/login")}
              className="rounded-xl border border-border bg-card px-4 py-4"
            >
              <Text className="font-semibold text-foreground">
                Đăng nhập để gắn xe và tạo booking
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Tài khoản guest chỉ xem được khung giờ trống.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Helper: thông báo cần chọn xe trước */}
        {isAuthenticated && !selectedVehicleId && vehicles.length > 0 && (
          <View className="px-4 mb-3">
            <View className="rounded-lg bg-secondary px-3 py-2">
              <Text className="text-xs text-primary font-medium">
                Vui lòng chọn phương tiện để hiển thị dịch vụ phù hợp.
              </Text>
            </View>
          </View>
        )}

        {/* 3. Chọn dịch vụ chính */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-1.5 h-6 rounded-full bg-primary" />
            <Text className="font-bold text-xl text-foreground flex-1">
              Dịch vụ chính
            </Text>
            {selectedService ? (
              <TouchableOpacity
                onPress={() => {
                  setSelectedServiceId("");
                  setAddOnServiceIds([]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-primary text-sm font-medium">
                  Thay đổi
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {selectedVehicleId ? (
            <Text className="text-xs text-muted-foreground mb-3 ml-3.5">
              Đang lọc theo{" "}
              {selectedVehicle?.vehicle_type === "CAR" ? "ô tô" : "xe máy"} của bạn
            </Text>
          ) : (
            <Text className="text-xs text-muted-foreground mb-3 ml-3.5">
              Chọn phương tiện trước để lọc dịch vụ phù hợp
            </Text>
          )}

          {compatibleMainServices.length === 0 ? (
            <View className="rounded-xl border border-border bg-card px-4 py-4">
              <Text className="text-sm text-muted-foreground">
                Không có dịch vụ chính phù hợp
                {selectedVehicle
                  ? ` cho ${
                      selectedVehicle.vehicle_type === "CAR" ? "ô tô" : "xe máy"
                    }`
                  : ""}
                .
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {compatibleMainServices.map((service) => {
                const selected = service.id === selectedServiceId;
                return (
                  <TouchableOpacity
                    key={service.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedServiceId(service.id);
                      setAddOnServiceIds([]);
                    }}
                    className={`flex-row items-center gap-3 bg-card rounded-xl border-2 px-4 py-3 ${
                      selected ? "border-primary" : "border-border"
                    }`}
                  >
                    <View className="flex-1">
                      <Text
                        className="font-semibold text-sm text-foreground leading-tight"
                        numberOfLines={1}
                      >
                        {service.name}
                      </Text>
                      <Text
                        className="text-xs text-muted-foreground mt-1"
                        numberOfLines={2}
                      >
                        {service.description ??
                          `${service.duration_minutes} phút`}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {service.vehicle_type === "CAR"
                          ? "Dành cho ô tô"
                          : "Dành cho xe máy"}
                        {" • "}
                        {service.duration_minutes} phút
                      </Text>
                    </View>
                    <View className="items-end gap-2">
                      <Text className="font-bold text-sm text-primary">
                        {selected && quotedPriceByServiceId.has(service.id)
                          ? formatCurrency(
                              quotedPriceByServiceId.get(service.id) ?? 0
                            )
                          : `Từ ${formatCurrency(service.base_price)}`}
                      </Text>
                      {selected ? (
                        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                          <Check size={13} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded-full border-2 border-border" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 3b. Chọn add-on (tick) */}
        {selectedServiceId && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center gap-2 mb-1">
              <View className="w-1.5 h-6 rounded-full bg-primary" />
              <Text className="font-bold text-xl text-foreground flex-1">
                Dịch vụ thêm
              </Text>
              {addOnServiceIds.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setAddOnServiceIds([])}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-primary text-sm font-medium">
                    Bỏ chọn
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-xs text-muted-foreground">Tùy chọn</Text>
              )}
            </View>
            <Text className="text-xs text-muted-foreground mb-3 ml-3.5">
              Tùy chọn thêm để nâng cấp dịch vụ, có thể chọn nhiều
            </Text>

            {availableAddOns.length === 0 ? (
              <View className="rounded-xl border border-border bg-card px-4 py-4">
                <Text className="text-sm text-muted-foreground">
                  Không có dịch vụ thêm cho loại xe đã chọn.
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {availableAddOns.map((addon) => {
                  const checked = addOnServiceIds.includes(addon.id);
                  return (
                    <TouchableOpacity
                      key={addon.id}
                      activeOpacity={0.8}
                      onPress={() => handleToggleAddOn(addon.id)}
                      className={`flex-row items-center gap-3 bg-card rounded-xl border-2 px-4 py-3 ${
                        checked ? "border-primary" : "border-border"
                      }`}
                    >
                      <View className="flex-1">
                        <Text
                          className="font-semibold text-sm text-foreground"
                          numberOfLines={1}
                        >
                          {addon.name}
                        </Text>
                        <Text
                          className="text-xs text-muted-foreground mt-0.5"
                          numberOfLines={1}
                        >
                          {addon.description ??
                            `${addon.duration_minutes} phút`}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-primary">
                        {checked && quotedPriceByServiceId.has(addon.id)
                          ? `+${formatCurrency(
                              quotedPriceByServiceId.get(addon.id) ?? 0
                            )}`
                          : `Từ ${formatCurrency(addon.base_price)}`}
                      </Text>
                      {checked ? (
                        <View className="w-6 h-6 rounded bg-primary items-center justify-center">
                          <CheckSquare size={14} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : (
                        <View className="w-6 h-6 rounded border-2 border-border" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 4. Date strip */}
        <DateStrip
          dates={dateOptions}
          selectedKey={selectedDate}
          onSelect={setSelectedDate}
          goldBadge={
            isAuthenticated ? "Customer đặt lịch trực tiếp" : "Guest chỉ xem"
          }
        />

        {/* 5. Time slots */}
        <View className="px-4 mb-3 flex-row items-center gap-2">
          {slotsLoading ? <ActivityIndicator size="small" color="#1a5fd4" /> : null}
          <Text
            className={`flex-1 text-xs leading-5 ${
              slotError ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {scheduleHint}
          </Text>
          {slotError ? (
            <TouchableOpacity
              onPress={() => setSlotReloadKey((current) => current + 1)}
              className="rounded-lg border border-primary px-3 py-2"
            >
              <Text className="text-xs font-semibold text-primary">Thử lại</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TimeSlotGrid
          slots={slotItems}
          onSelect={(id) => {
            const nextSlot = slotItems.find((item) => item.id === id);
            if (nextSlot?.raw?.is_available) {
              setSelectedSlot(nextSlot.raw);
            }
          }}
        />

        {availabilityChecked && availableSlotCount === 0 && !slotsLoading ? (
          <View className="px-4">
            <View className="rounded-xl border border-border bg-card px-4 py-4">
              <Text className="font-semibold text-foreground">
                Không có khung giờ khả dụng
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Thử garage khác, ngày khác hoặc bỏ tick các dịch vụ thêm.
              </Text>
              {isAuthenticated &&
              selectedGarageId &&
              selectedServiceId &&
              selectedVehicleId ? (
                <TouchableOpacity
                  onPress={() => handleJoinWaitlist()}
                  className="mt-3 rounded-xl bg-primary py-3 flex-row items-center justify-center gap-2"
                >
                  <Text className="text-white font-bold text-sm">
                    Vào danh sách chờ
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View
        className="bg-card border-t border-border px-4 pt-3 pb-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[11px] text-muted-foreground">
              Tổng tạm tính
            </Text>
            <Text className="text-xl font-extrabold text-primary mt-0.5">
              {quoteLoading
                ? "Đang tính..."
                : priceQuote
                  ? formatCurrency(totalPrice)
                  : "Chưa có báo giá"}
            </Text>
            {quoteError ? (
              <Text className="text-xs text-red-600 mt-0.5">{quoteError}</Text>
            ) : null}
            {addOnServiceIds.length > 0 ? (
              <Text className="text-xs text-muted-foreground mt-0.5">
                Bao gồm {addOnServiceIds.length} dịch vụ thêm
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            disabled={!canContinue}
            onPress={() => {
              if (!isAuthenticated) {
                router.push("/login");
                return;
              }

              if (
                !selectedVehicle ||
                !selectedService ||
                !selectedGarage ||
                !selectedSlot ||
                !priceQuote
              ) {
                Alert.alert(
                  "Thiếu thông tin",
                  "Vui lòng chọn garage, phương tiện, dịch vụ và khung giờ."
                );
                return;
              }

              router.push({
                pathname: "/payment",
                params: {
                  garageId: selectedGarage.id,
                  garageName: selectedGarage.name,
                  servicePackageId: selectedService.id,
                  serviceName: selectedService.name,
                  vehicleId: selectedVehicle.id,
                  vehicleName: toVehicleName(selectedVehicle),
                  vehiclePlate: selectedVehicle.raw_license_plate,
                  startTime: selectedSlot.start_time,
                  price: String(totalPrice),
                  quoteId: priceQuote.id,
                  addOnIds: addOnServiceIds.join(","),
                },
              });
            }}
            className={`px-6 py-3.5 rounded-2xl flex-row items-center gap-2 ${
              canContinue ? "bg-primary" : "bg-muted"
            }`}
            style={
              canContinue
                ? {
                    shadowColor: "#1a5fd4",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 4,
                  }
                : undefined
            }
          >
            <Text
              className={`text-sm font-bold ${
                canContinue ? "text-white" : "text-muted-foreground"
              }`}
            >
              Tiếp tục
            </Text>
            <ArrowRight
              size={16}
              color={canContinue ? "#ffffff" : "#7a8599"}
              strokeWidth={2.8}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
