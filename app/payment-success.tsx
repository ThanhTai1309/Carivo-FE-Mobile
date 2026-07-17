import { useEffect, useMemo, useRef, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  CalendarCheck,
  CarFront,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  House,
  MapPin,
  Share2,
  Sparkles,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatCurrency, formatDateTimeLong } from "@/lib/format";

function shortBookingId(id?: string | null): string {
  if (!id) return "—";
  const cleaned = id.replace(/-/g, "");
  if (cleaned.length <= 6) return id.toUpperCase();
  return `BK-${cleaned.slice(0, 4).toUpperCase()}-${cleaned.slice(-2).toUpperCase()}`;
}

function CountdownToSlot({ startTime }: { startTime?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [startTime]);

  return useMemo(() => {
    if (!startTime) return null;
    const target = new Date(startTime).getTime();
    const diffMs = target - now;
    if (Number.isNaN(target)) return null;
    if (diffMs <= 0) {
      return (
        <Text className="text-xs font-semibold text-primary">
          Đã đến giờ hẹn
        </Text>
      );
    }
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (days === 0 && minutes > 0) parts.push(`${minutes} phút`);
    return (
      <Text className="text-xs font-semibold text-primary">
        Còn {parts.join(" ") || "dưới 1 phút"} nữa đến lịch hẹn
      </Text>
    );
  }, [now, startTime]);
}

function DetailRow({
  icon: Icon,
  label,
  value,
  accent = "muted",
}: {
  icon: React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;
  label: string;
  value: string;
  accent?: "muted" | "primary";
}) {
  const isPrimary = accent === "primary";
  return (
    <View className="flex-row items-start gap-3">
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 ${
          isPrimary ? "bg-secondary" : "bg-muted"
        }`}
      >
        <Icon
          size={18}
          color={isPrimary ? "#1a5fd4" : "#1a1a1a"}
          strokeWidth={2.2}
        />
      </View>
      <View className="flex-1 pt-0.5">
        <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
          {label}
        </Text>
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

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    garageName?: string;
    serviceName?: string;
    startTime?: string;
    total?: string;
    vehiclePlate?: string;
  }>();

  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 350,
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

  const handleCopy = () => {
    if (!params.bookingId) return;
    // Fallback: setString via legacy API. Modern RN không còn Clipboard, dùng Share.
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!params.bookingId) return;
    try {
      await Share.share({
        message: `Lịch hẹn Carivo\nMã: ${bookingIdDisplay}\nDịch vụ: ${
          params.serviceName ?? "—"
        }\nThời gian: ${formattedStartTime}\nĐịa điểm: ${
          params.garageName ?? "—"
        }`,
        title: "Lịch hẹn Carivo",
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
        <LinearGradient
          colors={["#1a5fd4", "#2f7be0", "#5a9bf0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative items-center pt-16 pb-12 px-6"
        >
          {/* Decorative dots */}
          <View
            style={[
              styles.dot,
              { top: 36, left: 36, width: 10, height: 10, opacity: 0.45 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 64, right: 56, width: 6, height: 6, opacity: 0.35 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 120, right: 28, width: 12, height: 12, opacity: 0.3 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 140, left: 32, width: 6, height: 6, opacity: 0.25 },
            ]}
          />
          <View
            style={[
              styles.dot,
              { top: 88, left: 70, width: 4, height: 4, opacity: 0.3 },
            ]}
          />

          {/* Animated check ring (centered) */}
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
                        inputRange: [0.4, 1],
                        outputRange: [0.6, 0.92],
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
              <Check size={48} color="#1a5fd4" strokeWidth={3.2} />
            </Animated.View>
          </View>

          <Text className="text-2xl font-bold text-white text-center mt-6 tracking-tight px-4">
            Đặt lịch thành công
          </Text>
          <View className="flex-row items-center gap-1.5 mt-2 bg-white/15 rounded-full px-3 py-1">
            <Sparkles size={14} color="#ffffff" strokeWidth={2.4} />
            <Text className="text-xs font-semibold text-white tracking-wide">
              Carivo đã ghi nhận booking
            </Text>
          </View>
        </LinearGradient>

        {/* Booking code card */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="mx-4 mt-6"
        >
          <View style={styles.cardShadow} className="rounded-2xl bg-card">
            {/* Header strip */}
            <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-lg bg-secondary items-center justify-center">
                  <CalendarCheck size={16} color="#1a5fd4" strokeWidth={2.5} />
                </View>
                <Text className="text-xs font-bold text-foreground tracking-wider">
                  MÃ BOOKING
                </Text>
              </View>
              <View
                style={{ backgroundColor: "#dcfce7" }}
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
              >
                <View
                  style={{ backgroundColor: "#16a34a" }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <Text
                  style={{ color: "#15803d" }}
                  className="text-[11px] font-bold"
                >
                  ĐÃ XÁC NHẬN
                </Text>
              </View>
            </View>

            {/* Code + copy */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-secondary/40">
              <Text
                className="text-xl font-black text-primary tracking-widest"
                style={{ letterSpacing: 2 }}
              >
                {bookingIdDisplay}
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg"
              >
                <Copy
                  size={14}
                  color={copied ? "#16a34a" : "#1a5fd4"}
                  strokeWidth={2.4}
                />
                <Text
                  className={`text-xs font-bold ${
                    copied ? "text-emerald-700" : "text-primary"
                  }`}
                >
                  {copied ? "Đã sao chép" : "Sao chép"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Countdown */}
            {params.startTime && (
              <View className="flex-row items-center gap-2 px-5 py-3 border-t border-border">
                <Clock3 size={14} color="#1a5fd4" strokeWidth={2.4} />
                <CountdownToSlot startTime={params.startTime} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Detail rows */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="mx-4 mt-4"
        >
          <View style={styles.cardShadow} className="rounded-2xl bg-card px-5 py-4">
            <DetailRow
              icon={Calendar}
              label="Ngày & giờ"
              value={
                formattedStartTime +
                (formattedShortTime ? ` • ${formattedShortTime}` : "")
              }
              accent="primary"
            />
            <View className="h-px bg-border my-3.5" />
            <DetailRow
              icon={MapPin}
              label="Địa điểm"
              value={params.garageName ?? "Garage đã chọn"}
            />
            <View className="h-px bg-border my-3.5" />
            <DetailRow
              icon={CarFront}
              label="Gói dịch vụ"
              value={params.serviceName ?? "Dịch vụ đã chọn"}
            />
            {params.vehiclePlate ? (
              <>
                <View className="h-px bg-border my-3.5" />
                <DetailRow
                  icon={CarFront}
                  label="Biển số xe"
                  value={params.vehiclePlate}
                />
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* Total */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="mx-4 mt-4"
        >
          <View
            style={styles.cardShadow}
            className="rounded-2xl bg-primary px-5 py-4 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-xs font-bold text-white/80 tracking-wider">
                TỔNG CỘNG
              </Text>
              <Text className="text-[11px] text-white/70 mt-0.5">
                Đã bao gồm khuyến mãi (nếu có)
              </Text>
            </View>
            <Text className="text-2xl font-black text-white">
              {formatCurrency(Number(params.total ?? 0))}
            </Text>
          </View>
        </Animated.View>

        {/* Payment pending notice */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="mx-4 mt-4"
        >
          <View
            style={{
              backgroundColor: "#fffbeb",
              borderColor: "#fde68a",
              borderWidth: 1,
            }}
            className="flex-row items-start gap-3 rounded-xl px-4 py-3"
          >
            <CircleAlert
              size={18}
              color="#b45309"
              strokeWidth={2.4}
              style={{ marginTop: 1 }}
            />
            <View className="flex-1">
              <Text
                style={{ color: "#78350f" }}
                className="text-sm font-bold"
              >
                Thanh toán tại garage
              </Text>
              <Text
                style={{ color: "#92400e" }}
                className="text-xs mt-1 leading-relaxed"
              >
                Mobile app chưa hỗ trợ thanh toán online. Vui lòng thanh toán
                trực tiếp khi đến garage.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="px-4 mt-6 gap-3"
        >
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2"
            style={styles.primaryShadow}
          >
            <CalendarCheck size={20} color="#ffffff" strokeWidth={2.4} />
            <Text className="text-white font-bold text-base tracking-wide">
              Xem chi tiết booking
            </Text>
            <ChevronRight size={18} color="#ffffff" strokeWidth={2.7} />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              className="flex-1 bg-card border border-border rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            >
              <Share2 size={18} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="text-primary font-bold text-sm">Chia sẻ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.85}
              className="flex-1 bg-card border border-border rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            >
              <House size={18} color="#1a5fd4" strokeWidth={2.4} />
              <Text className="text-primary font-bold text-sm">Trang chủ</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer note */}
        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          className="items-center mt-6 px-6 gap-1"
        >
          <Text className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Vui lòng đến garage trước giờ hẹn 10 phút để được phục vụ tốt nhất.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  checkStack: {
    width: 168,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  ringOuter: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  ringMiddle: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "transparent",
  },
  ringInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0c3a8c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  cardShadow: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryShadow: {
    shadowColor: "#1a5fd4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
});