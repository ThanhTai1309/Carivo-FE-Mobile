import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CarFront,
  CircleCheck,
  Clock4,
  Warehouse,
  MapPin,
  NotebookPen,
  Sparkles,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import LoadingButton from "@/components/common/LoadingButton";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Garage, ServicePackage, Vehicle } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

type DateOffset = 0;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateLabel(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

function formatTimeLabel(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NewWaitlistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    garageId?: string;
    servicePackageId?: string;
    vehicleId?: string;
  }>();
  const { accessToken, isAuthenticated, isHydrated } = useApp();

  const [garages, setGarages] = useState<Garage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [garageId, setGarageId] = useState<string>(params.garageId ?? "");
  const [vehicleId, setVehicleId] = useState<string>(params.vehicleId ?? "");
  const [serviceId, setServiceId] = useState<string>(
    params.servicePackageId ?? ""
  );
  const [dateOffset, setDateOffset] = useState(0);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [garageRes, vehicleRes, serviceRes] = await Promise.all([
        api.getGarages({ is_active: true, limit: 30 }),
        api.getVehicles(accessToken, { is_active: true, limit: 50 }),
        api.getServicePackages({ is_active: true, limit: 50 }),
      ]);
      setGarages(garageRes.data ?? []);
      setVehicles(vehicleRes.data ?? []);

      const allServices = (serviceRes.data ?? []).filter(
        (s) => s.service_type !== "ADDON"
      );
      setServices(allServices);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Kh?ng th? t?i danh s?ch.";
      Alert.alert("L?i", message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) void loadData();
  }, [isHydrated, isAuthenticated, loadData]);

  // Refresh vehicles whenever screen regains focus (e.g. after adding a new vehicle)
  useFocusEffect(
    useCallback(() => {
      if (accessToken) {
        api
          .getVehicles(accessToken, { is_active: true, limit: 50 })
          .then((res) => {
            const data = res.data ?? [];
            setVehicles(data);
            setVehicleId((current) =>
              current && data.some((v) => v.id === current)
                ? current
                : current || ""
            );
          })
          .catch(() => undefined);
      }
    }, [accessToken])
  );

  const selectedGarage = garages.find((g) => g.id === garageId);
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedService = services.find((s) => s.id === serviceId);

  const desiredDate = (() => {
    const base = startOfDay(new Date());
    base.setDate(base.getDate() + dateOffset);
    base.setHours(hour, minute, 0, 0);
    return base;
  })();

  const validService = (() => {
    if (!selectedService) return true;
    if (!selectedVehicle) return true;
    return selectedService.vehicle_type === selectedVehicle.vehicle_type;
  })();

  const canSubmit =
    garageId && vehicleId && serviceId && validService && !submitting;

  const handleSubmit = async () => {
    if (!accessToken || !canSubmit) return;
    setSubmitting(true);
    try {
      await api.createWaitlist(accessToken, {
        garage_id: garageId,
        vehicle_id: vehicleId,
        service_package_id: serviceId,
        desired_start_time: desiredDate.toISOString(),
        note: note.trim() || undefined,
      });
      Alert.alert(
        "?? v?o danh s?ch ch?",
        "Ch?ng t?i s? th?ng b?o khi garage c? slot tr?ng.",
        [
          {
            text: "Xem danh s?ch",
            onPress: () => router.replace("/waitlist"),
          },
          { text: "OK", style: "cancel" },
        ]
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Kh?ng th? t?o y?u c?u ch?.";
      Alert.alert("L?i", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="?ang t?i" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="V?o danh s?ch ch?"
          description="??ng nh?p ?? ??ng k? ch? slot."
          actionLabel="??ng nh?p"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  const dateChips = Array.from({ length: 7 }, (_, i) => i).map((i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 - 18:00
  const minutes = [0, 15, 30, 45];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-card items-center justify-center"
        >
          <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-foreground">
            ??ng k? ch? slot
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Nh?n th?ng b?o khi garage m? slot tr?ng
          </Text>
        </View>
      </View>

      {loading ? (
        <ScreenState loading title="?ang t?i" />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-4 gap-4">
            {/* Garage */}
            <Section
              icon={Warehouse}
              title="Garage"
              selected={selectedGarage?.name}
            >
              <View className="flex-row flex-wrap gap-2">
                {garages.length === 0 ? (
                  <Empty text="Kh?ng t?m th?y garage kh? d?ng." />
                ) : (
                  garages.map((g) => (
                    <Chip
                      key={g.id}
                      active={garageId === g.id}
                      label={g.name}
                      onPress={() => setGarageId(g.id)}
                    />
                  ))
                )}
              </View>
            </Section>

            {/* Vehicle */}
            <Section icon={CarFront} title="Ph??ng ti?n" selected={selectedVehicle?.raw_license_plate}>
              <View className="flex-row flex-wrap gap-2">
                {vehicles.length === 0 ? (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-muted-foreground">
                      B?n ch?a c? ph??ng ti?n n?o.
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/vehicle-form")}
                      className="rounded-full bg-secondary px-3 py-1.5"
                    >
                      <Text className="text-[11px] font-semibold text-primary">
                        + Th?m
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  vehicles.map((v) => (
                    <Chip
                      key={v.id}
                      active={vehicleId === v.id}
                      label={`${v.raw_license_plate} ? ${labelVehicleType(v.vehicle_type)}`}
                      onPress={() => setVehicleId(v.id)}
                    />
                  ))
                )}
              </View>
            </Section>

            {/* Service */}
            <Section icon={Sparkles} title="D?ch v?" selected={selectedService?.name}>
              <View className="flex-row flex-wrap gap-2">
                {services
                  .filter(
                    (s) =>
                      !selectedVehicle || s.vehicle_type === selectedVehicle.vehicle_type
                  )
                  .map((s) => (
                    <Chip
                      key={s.id}
                      active={serviceId === s.id}
                      label={`${s.name} ? ${s.duration_minutes ?? "?"}p`}
                      onPress={() => setServiceId(s.id)}
                    />
                  ))}
                {services.length === 0 ? (
                  <Empty text="Ch?a c? d?ch v? kh? d?ng." />
                ) : null}
              </View>
              {selectedService && selectedVehicle && !validService ? (
                <Text className="text-[11px] text-red-600 mt-2">
                  D?ch v? kh?ng ph? h?p v?i lo?i ph??ng ti?n hi?n t?i.
                </Text>
              ) : null}
            </Section>

            {/* Date */}
            <Section
              icon={Calendar}
              title="Ng?y mong mu?n"
              selected={formatDateTime(desiredDate.toISOString())}
            >
              <View className="flex-row flex-wrap gap-2">
                {dateChips.map((d, idx) => (
                  <Chip
                    key={idx}
                    active={dateOffset === idx}
                    label={
                      idx === 0
                        ? "H?m nay"
                        : idx === 1
                        ? "Ng?y mai"
                        : formatDateLabel(d)
                    }
                    onPress={() => setDateOffset(idx)}
                  />
                ))}
              </View>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {hours.map((h) => (
                  <Chip
                    key={h}
                    active={hour === h}
                    label={`${pad(h)}h`}
                    onPress={() => setHour(h)}
                  />
                ))}
              </View>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {minutes.map((m) => (
                  <Chip
                    key={m}
                    active={minute === m}
                    label={formatTimeLabel(new Date(2024, 0, 1, 0, m, 0))}
                    onPress={() => setMinute(m)}
                  />
                ))}
              </View>
            </Section>

            {/* Note */}
            <Section icon={NotebookPen} title="Ghi ch? (tu? ch?n)">
              <View className="rounded-xl border border-border bg-input p-3">
                <TextInputMultiLine
                  value={note}
                  onChangeText={setNote}
                  placeholder="V? d?: c?n ch? ?? g?n c?a, ?u ti?n ngo?i gi? h?nh ch?nh..."
                />
              </View>
            </Section>

            <LoadingButton
              title="V?o danh s?ch ch?"
              loadingTitle="?ang g?i..."
              loading={submitting}
              onPress={handleSubmit}
              disabled={!canSubmit}
              icon={Clock4}
            />
            {selectedGarage ? (
              <Text className="text-[11px] text-muted-foreground text-center">
                <MapPin size={11} color="#7a8599" /> {selectedGarage.address}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type SectionProps = {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  title: string;
  selected?: string;
  children: React.ReactNode;
};

function Section({ icon: Icon, title, selected, children }: SectionProps) {
  return (
    <View className="rounded-2xl bg-card border border-border p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <Icon size={16} color="#1a5fd4" strokeWidth={2.2} />
        <Text className="text-sm font-bold text-foreground">{title}</Text>
      </View>
      {selected ? (
        <Text className="text-[11px] text-muted-foreground mb-2">
          ?? ch?n: {selected}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`flex-row items-center gap-1 rounded-full px-3 py-2 border ${
        active ? "bg-primary border-primary" : "bg-card border-border"
      }`}
    >
      {active ? <CircleCheck size={12} color="#ffffff" strokeWidth={2.4} /> : null}
      <Text
        className={`text-xs font-semibold ${active ? "text-white" : "text-foreground"}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Text className="text-xs text-muted-foreground italic">{text}</Text>
  );
}

function labelVehicleType(t: string) {
  if (t === "MOTORBIKE") return "Xe m?y";
  if (t === "CAR") return "? t?";
  return t;
}

function TextInputMultiLine({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      multiline
      textAlignVertical="top"
      maxLength={500}
      className="text-foreground min-h-[80px]"
    />
  );
}

export default function NewWaitlistScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="L?i t?o y?u c?u ch?">
      <NewWaitlistScreen />
    </ErrorBoundary>
  );
}
