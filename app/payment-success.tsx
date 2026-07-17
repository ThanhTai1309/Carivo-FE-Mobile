import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  CarFront,
  Check,
  ChevronRight,
  CircleHelp,
  Clock4,
  CreditCard,
  House,
  LifeBuoy,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatCurrency, formatDateTimeLong } from "@/lib/format";

function shortBookingId(id?: string | null): string {
  if (!id) return "—";
  const cleaned = id.replace(/-/g, "");
  if (cleaned.length <= 6) return id.toUpperCase();
  return `${cleaned.slice(0, 4).toUpperCase()}${cleaned
    .slice(-4)
    .toUpperCase()}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="w-11 h-11 rounded-xl bg-muted items-center justify-center flex-shrink-0">
        <Icon size={20} color="#1a1a1a" strokeWidth={1.9} />
      </View>
      <View className="flex-1 pt-0.5">
        <Text className="text-xs text-muted-foreground mb-0.5">{label}</Text>
        <Text
          className="text-sm font-semibold text-foreground leading-snug"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <CreditCard size={18} color="#1a1f2e" strokeWidth={2} />
      <Text className="text-xs font-bold text-foreground tracking-wider">
        {label}
      </Text>
    </View>
  );
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    garageName?: string;
    serviceName?: string;
    startTime?: string;
    total?: string;
    vehiclePlate?: string;
    paymentMethod?: string;
  }>();

  // Animations
  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 550,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const bookingIdDisplay = shortBookingId(params.bookingId);
  const formattedStartTime = params.startTime
    ? formatDateTimeLong(params.startTime)
    : "Chưa có thời gian";
  const formattedShortTime = useMemo(() => {
    if (!params.startTime) return "";
    return new Date(params.startTime).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [params.startTime]);
  const totalAmount = formatCurrency(Number(params.total ?? 0));

  const handleShare = async () => {
    if (!params.bookingId) return;
    try {
      await Share.share({
        message: `Đặt lịch Carivo thành công!\nMã: ${bookingIdDisplay}\nDịch vụ: ${
          params.serviceName ?? "—"
        }\nThời gian: ${formattedStartTime}\nĐịa điểm: ${
          params.garageName ?? "—"
        }\nTổng: ${totalAmount}`,
        title: "Đặt lịch Carivo",
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <View
          style={styles.heroBg}
          className="relative items-center pt-14 pb-10 px-6"
        >
          {/* Decorative dots (blue, subtle) */}
          <View
            style={[
              styles.dot,
              { top: 40, left: 32, width: 8, height: 8, opacity: 0.35 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 72, right: 48, width: 6, height: 6, opacity: 0.28 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 120, right: 28, width: 10, height: 10, opacity: 0.25 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 138, left: 38, width: 6, height: 6, opacity: 0.22 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 96, left: 60, width: 4, height: 4, opacity: 0.28 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 50, left: "48%", width: 5, height: 5, opacity: 0.25 },
            ]}
          />

          {/* Check icon stack */}
          <View style={styles.checkStack}>
            <Animated.View
              style={[
                styles.ringOuter,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ringMiddle,
                {
                  opacity: ringOpacity,
                  transform: [
                    {
                      scale: ringScale.interpolate({
                        inputRange: [0.7, 1],
                        outputRange: [0.85, 0.95],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ringInner,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              <Check size={52} color="#1a5fd4" strokeWidth={3.2} />
            </Animated.View>
          </View>

          <Text className="text-[26px] font-bold text-primary text-center mt-5 tracking-tight px-4">
            Đặt lịch thành công!
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-2 leading-relaxed px-6">
            Cảm ơn bạn đã đặt dịch vụ tại Carivo. Chúng tôi sẽ liên hệ với bạn
            để xác nhận trong ít phút.
          </Text>

          {/* Booking ID strip */}
          <View className="flex-row items-center gap-2 mt-5 bg-card border border-border rounded-full px-4 py-2">
            <ShieldCheck size={14} color="#16a34a" strokeWidth={2.4} />
            <Text className="text-xs font-semibold text-foreground">
              Mã booking:
            </Text>
            <Text className="text-xs font-bold text-primary tracking-wider">
              {bookingIdDisplay}
            </Text>
          </View>
        </View>

        {/* Combined info card */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="mx-4"
        >
          <View style={styles.cardShadow} className="rounded-2xl bg-card px-5 py-5">
            <InfoRow
              icon={Calendar}
              label="Ngày & giờ"
              value={
                formattedStartTime +
                (formattedShortTime ? ` • ${formattedShortTime}` : "")
              }
            />
            <View className="h-px bg-border my-4" />
            <InfoRow
              icon={MapPin}
              label="Địa điểm"
              value={params.garageName ?? "Garage đã chọn"}
            />
            <View className="h-px bg-border my-4" />
            <InfoRow
              icon={CarFront}
              label="Gói dịch vụ"
              value={params.serviceName ?? "Dịch vụ đã chọn"}
            />
            {params.vehiclePlate ? (
              <>
                <View className="h-px bg-border my-4" />
                <InfoRow
                  icon={Clock4}
                  label="Biển số xe"
                  value={params.vehiclePlate}
                />
              </>
            ) : null}

            {/* Total row */}
            <View className="h-px bg-border my-4" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-muted-foreground">Tổng cộng</Text>
                <Text className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Đã bao gồm VAT
                </Text>
              </View>
              <Text className="text-xl font-bold text-primary tracking-tight">
                {totalAmount}
              </Text>
            </View>

            {/* Payment method */}
            <View className="h-px bg-border my-4" />
            <View className="flex-row items-center justify-between">
              <PaymentBadge label="Thanh toán tại garage" />
              <View className="flex-row items-center gap-2">
                <View style={styles.cardLogo}>
                  <Text style={styles.cardLogoText}>VISA</Text>
                </View>
                <View style={[styles.cardLogo, { backgroundColor: "#1a1f2e" }]}>
                  <Text style={[styles.cardLogoText, { color: "#f59e0b" }]}>
                    MC
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="px-4 mt-5 gap-3"
        >
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
            className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
          >
            <Text className="text-white font-bold text-base">
              Xem lịch hẹn của tôi
            </Text>
            <ChevronRight size={20} color="#ffffff" strokeWidth={2.6} />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              className="flex-1 bg-card border border-border rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            >
              <LifeBuoy size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-primary font-semibold text-sm">
                Chia sẻ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.85}
              className="flex-1 bg-card border border-border rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            >
              <House size={16} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-primary font-semibold text-sm">
                Trang chủ
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Help footer */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="items-center mt-6 px-8 gap-1"
        >
          <View className="flex-row items-center gap-1.5">
            <CircleHelp size={14} color="#7a8599" strokeWidth={2.2} />
            <Text className="text-xs text-muted-foreground">
              Bạn gặp vấn đề?
            </Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text className="text-xs font-semibold text-primary">
                Liên hệ hỗ trợ
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-[11px] text-muted-foreground/80 text-center leading-relaxed mt-2">
            Lịch hẹn sẽ được giữ trong 15 phút. Vui lòng đến đúng giờ để được
            phục vụ tốt nhất.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroBg: {
    backgroundColor: "#eaf1fb",
  },
  dot: {
    position: "absolute",
    backgroundColor: "#1a5fd4",
    borderRadius: 2,
  },
  checkStack: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(26,95,212,0.22)",
    backgroundColor: "rgba(26,95,212,0.04)",
  },
  ringMiddle: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2.5,
    borderColor: "rgba(26,95,212,0.45)",
    backgroundColor: "transparent",
  },
  ringInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#d6e4f7",
    shadowColor: "#1a5fd4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  cardShadow: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardLogo: {
    width: 36,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#1a5fd4",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLogoText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});