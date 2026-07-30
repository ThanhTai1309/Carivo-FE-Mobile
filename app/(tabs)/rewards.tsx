import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowUpRight,
  Award,
  ChevronRight,
  Crown,
  Gift,
  History,
  Medal,
  Sparkles,
  Ticket,
  Trophy,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import type { QueryValue } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type {
  LoyaltyAccount,
  LoyaltySummary,
  LoyaltyTierRule,
  LoyaltyTransaction,
  Promotion,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

type LoyaltyTransactionType =
  | "EARN"
  | "REDEEM"
  | "REFUND"
  | "EXPIRE"
  | "ADJUST"
  | "SURVEY_REWARD"
  | "REVIEW_REWARD"
  | string;

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  EARN: "Tích điểm",
  REDEEM: "Dùng điểm",
  REFUND: "Hoàn điểm",
  EXPIRE: "Hết hạn điểm",
  ADJUST: "Điều chỉnh điểm",
  SURVEY_REWARD: "Thưởng khảo sát",
  REVIEW_REWARD: "Thưởng đánh giá",
};

const TRANSACTION_DESCRIPTION_PREFIX: Record<string, string> = {
  EARN: "Cộng điểm từ lịch rửa xe đã hoàn thành",
  REDEEM: "Dùng điểm để giảm giá cho lịch đặt",
  REFUND: "Hoàn lại điểm do lịch đặt bị hủy",
  EXPIRE: "Điểm tích lũy đã hết hạn",
  ADJUST: "Điều chỉnh điểm thủ công bởi hệ thống",
  SURVEY_REWARD: "Cộng điểm khi hoàn thành khảo sát sau dịch vụ",
  REVIEW_REWARD: "Cộng điểm khi đánh giá garage và dịch vụ",
};

function translateTransactionDescription(
  transaction: LoyaltyTransaction
): string {
  const fallback =
    TRANSACTION_DESCRIPTION_PREFIX[transaction.type ?? ""] ??
    "Giao dịch điểm thưởng";
  const raw = transaction.description?.trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  if (lower.startsWith("earn points from completed paid booking")) return fallback;
  if (lower.startsWith("redeem points for booking discount")) return fallback;
  if (lower.startsWith("refund redeemed points for canceled booking")) return fallback;
  if (lower.startsWith("expire unused loyalty points")) return fallback;
  return raw;
}

type TierName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

const TIER_ORDER: TierName[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

interface TierPresentation {
  label: string;
  description: string;
  gradientClass: string;
  accentColor: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
}

const TIER_PRESENTATION: Record<TierName, TierPresentation> = {
  BRONZE: {
    label: "Đồng",
    description: "Hạng khởi đầu cho mọi khách hàng",
    gradientClass: "from-amber-700 to-amber-900",
    accentColor: "#b45309",
    icon: Medal,
  },
  SILVER: {
    label: "Bạc",
    description: "Tích lũy nhanh hơn và ưu tiên đặt lịch",
    gradientClass: "from-slate-400 to-slate-600",
    accentColor: "#475569",
    icon: Award,
  },
  GOLD: {
    label: "Vàng",
    description: "Quyền lợi nâng cao và hệ số điểm tốt hơn",
    gradientClass: "from-yellow-400 to-amber-600",
    accentColor: "#a16207",
    icon: Crown,
  },
  PLATINUM: {
    label: "Bạch kim",
    description: "Hạng cao nhất với đặc quyền đối tác ưu tiên",
    gradientClass: "from-indigo-400 to-fuchsia-500",
    accentColor: "#6366f1",
    icon: Trophy,
  },
};

function normalizeTier(value?: string | null): TierName {
  if (!value) return "BRONZE";
  const upper = value.toUpperCase();
  return TIER_ORDER.includes(upper as TierName) ? (upper as TierName) : "BRONZE";
}

function pickPresentation(value?: string | null): TierPresentation {
  return TIER_PRESENTATION[normalizeTier(value)];
}

function isActivePromotion(promo: Promotion): boolean {
  if (promo.is_active === false) return false;
  const now = Date.now();
  if (promo.start_at) {
    const start = new Date(promo.start_at).getTime();
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (promo.end_at) {
    const end = new Date(promo.end_at).getTime();
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}

function isPromotionAvailableForTier(
  promo: Promotion,
  currentTier: TierName
): boolean {
  if (!promo.applicable_tiers?.length) return true;
  return promo.applicable_tiers.some(
    (tier) => normalizeTier(tier) === currentTier
  );
}

function formatDiscount(promo: Promotion): string {
  if (promo.discount_type === "PERCENTAGE") {
    return `Giảm ${promo.discount_value}%`;
  }
  return `Giảm ${formatCurrency(promo.discount_value)}`;
}

function formatExpiry(promo: Promotion): string | null {
  if (!promo.end_at) return null;
  const date = new Date(promo.end_at);
  if (Number.isNaN(date.getTime())) return null;
  return `HSD ${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function nextTierRule(
  currentTier: TierName,
  rules: LoyaltyTierRule[]
): LoyaltyTierRule | null {
  if (rules.length === 0) return null;
  const sorted = [...rules].sort(
    (a, b) => (a.min_total_points ?? 0) - (b.min_total_points ?? 0)
  );
  const currentIndex = TIER_ORDER.indexOf(currentTier);

  if (currentIndex >= 0 && currentIndex < TIER_ORDER.length - 1) {
    const targetTier = TIER_ORDER[currentIndex + 1];
    const explicitMatch = sorted.find(
      (rule) => normalizeTier(rule.tier_name) === targetTier
    );
    if (explicitMatch) return explicitMatch;
  }

  if (currentIndex === TIER_ORDER.length - 1) return null;

  const fallback = sorted.find(
    (rule) => (rule.min_total_points ?? 0) > (sorted[0]?.min_total_points ?? 0)
  );
  return fallback ?? null;
}

interface TierProgressCardProps {
  account: LoyaltyAccount | null;
  currentTier: TierName;
  nextRule: LoyaltyTierRule | null;
}

function TierProgressCard({
  account,
  currentTier,
  nextRule,
}: TierProgressCardProps) {
  const presentation = TIER_PRESENTATION[currentTier];
  const Icon = presentation.icon;
  const totalPoints = account?.total_points ?? 0;
  const qualifyingPoints = account?.qualifying_points ?? totalPoints;
  const bonusPoints = account?.bonus_points ?? 0;
  const availablePoints = account?.available_points ?? 0;
  const redeemedPoints = account?.redeemed_points ?? 0;
  const totalSpent = account?.total_spent ?? 0;
  const totalVisits = account?.total_visits ?? 0;
  const targetSpent = nextRule?.min_total_spent ?? 0;
  const targetVisits = nextRule?.min_total_visits ?? 0;
  const targetPoints = nextRule?.min_total_points ?? 0;
  const remainingSpent = Math.max(0, targetSpent - totalSpent);
  const remainingVisits = Math.max(0, targetVisits - totalVisits);
  const remainingPoints = Math.max(0, targetPoints - qualifyingPoints);
  const criteria = [
    {
      label: "Chi tiêu",
      value: formatCurrency(totalSpent),
      target: formatCurrency(targetSpent),
      progress:
        targetSpent > 0 ? clampPercent((totalSpent / targetSpent) * 100) : 100,
    },
    {
      label: "Booking hoàn thành",
      value: totalVisits.toLocaleString("vi-VN"),
      target: targetVisits.toLocaleString("vi-VN"),
      progress:
        targetVisits > 0 ? clampPercent((totalVisits / targetVisits) * 100) : 100,
    },
    {
      label: "Điểm xét hạng",
      value: qualifyingPoints.toLocaleString("vi-VN"),
      target: targetPoints.toLocaleString("vi-VN"),
      progress:
        targetPoints > 0
          ? clampPercent((qualifyingPoints / targetPoints) * 100)
          : 100,
    },
  ];
  const progress = nextRule
    ? Math.min(...criteria.map((criterion) => criterion.progress))
    : 100;
  const isEligible =
    remainingSpent === 0 && remainingVisits === 0 && remainingPoints === 0;
  const remainingParts = [
    remainingSpent > 0 ? `${formatCurrency(remainingSpent)} chi tiêu` : null,
    remainingVisits > 0
      ? `${remainingVisits.toLocaleString("vi-VN")} booking`
      : null,
    remainingPoints > 0
      ? `${remainingPoints.toLocaleString("vi-VN")} điểm xét hạng`
      : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <View
      className={`mx-4 mt-2 rounded-3xl overflow-hidden bg-gradient-to-br ${presentation.gradientClass}`}
      style={{ backgroundColor: presentation.accentColor }}
    >
      <View className="p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
              <Icon size={22} color="#ffffff" strokeWidth={2.4} />
            </View>
            <View>
              <Text className="text-xs text-white/70 font-semibold tracking-wide">
                HẠNG THÀNH VIÊN
              </Text>
              <Text className="text-xl font-bold text-white">
                {presentation.label}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-white/90 text-sm mt-3" numberOfLines={2}>
          {presentation.description}
        </Text>

        <View className="mt-5">
          <Text className="text-white/70 text-xs">Điểm khả dụng</Text>
          <Text className="text-white text-4xl font-bold mt-1">
            {availablePoints.toLocaleString("vi-VN")}
          </Text>
          <Text className="text-white/80 text-xs mt-1">
            Tổng tích lũy: {totalPoints.toLocaleString("vi-VN")} điểm
          </Text>
          <Text className="text-white/80 text-xs mt-1">
            Điểm xét hạng: {qualifyingPoints.toLocaleString("vi-VN")}
            {bonusPoints > 0
              ? ` · Điểm thưởng thêm: ${bonusPoints.toLocaleString("vi-VN")}`
              : ""}
          </Text>
        </View>

        <View className="mt-5">
          {nextRule ? (
            <>
              <View className="flex-row items-center justify-between mb-2">
<Text className="text-xs text-white/80">
                Tiến trình lên{" "}
                <Text className="text-white font-bold">
                  {TIER_PRESENTATION[normalizeTier(nextRule.tier_name)]?.label ??
                    nextRule.tier_name}
                </Text>
              </Text>
                <Text className="text-xs text-white/80">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                <View
                  className="h-full rounded-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <View className="mt-3 gap-2">
                {criteria.map((criterion) => (
                  <View key={criterion.label}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[11px] text-white/80">
                        {criterion.label}
                      </Text>
                      <Text className="text-[11px] text-white font-semibold">
                        {criterion.value} / {criterion.target}
                      </Text>
                    </View>
                    <View className="h-1.5 rounded-full bg-white/20 overflow-hidden mt-1">
                      <View
                        className="h-full rounded-full bg-white"
                        style={{ width: `${criterion.progress}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <Text className="text-xs text-white/80 mt-2">
                {isEligible ? (
                  <>Bạn đã đủ điều kiện thăng hạng.</>
                ) : (
                  <>Cần thêm {remainingParts.join(", ")} để thăng hạng.</>
                )}
              </Text>
            </>
          ) : (
            <View className="rounded-xl bg-white/15 px-3 py-2">
              <Text className="text-xs text-white font-semibold">
                Bạn đang ở hạng cao nhất trong hệ thống.
              </Text>
            </View>
          )}
        </View>

        {redeemedPoints > 0 ? (
          <Text className="text-white/70 text-xs mt-3">
            Đã dùng: {redeemedPoints.toLocaleString("vi-VN")} điểm
          </Text>
        ) : null}
      </View>
    </View>
  );
}

interface PromotionCardProps {
  promotion: Promotion;
  onApply: (promotion: Promotion) => void;
}

function PromotionCard({ promotion, onApply }: PromotionCardProps) {
  const expiry = formatExpiry(promotion);
  return (
    <View className="rounded-2xl border border-border bg-card p-4 flex-row gap-3">
      <View className="w-12 h-12 rounded-xl bg-secondary items-center justify-center">
        <Ticket size={22} color="#1a56db" strokeWidth={2.4} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Text className="text-sm font-bold text-foreground">
            {promotion.code}
          </Text>
          <View className="rounded-full bg-secondary px-2 py-0.5">
            <Text className="text-[11px] font-semibold text-primary">
              {formatDiscount(promotion)}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-foreground mt-1" numberOfLines={2}>
          {promotion.name}
        </Text>
        {promotion.description ? (
          <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
            {promotion.description}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between mt-3">
          {expiry ? (
            <Text className="text-[11px] text-muted-foreground">{expiry}</Text>
          ) : (
            <Text className="text-[11px] text-muted-foreground">
              Áp dụng cho mọi dịch vụ
            </Text>
          )}
          <TouchableOpacity
            onPress={() => onApply(promotion)}
            className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full"
          >
            <Text className="text-xs font-semibold text-white">Dùng ngay</Text>
            <ArrowUpRight size={14} color="#ffffff" strokeWidth={2.6} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface TierLadderProps {
  rules: LoyaltyTierRule[];
  currentTier: TierName;
}

function TierLadder({ rules, currentTier }: TierLadderProps) {
  if (rules.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground">
        Hệ thống chưa công bố quy tắc hạng.
      </Text>
    );
  }

  const sorted = [...rules].sort(
    (a, b) => (a.min_total_points ?? 0) - (b.min_total_points ?? 0)
  );
  const currentIndex = TIER_ORDER.indexOf(currentTier);

  return (
    <View className="gap-2">
      {sorted.map((rule, index) => {
        const fallbackTier = TIER_ORDER[index] ?? "BRONZE";
        const tierName = normalizeTier(rule.tier_name ?? fallbackTier);
        const presentation = TIER_PRESENTATION[tierName];
        const Icon = presentation.icon;
        const isCurrent = tierName === currentTier;
        const isPassed = currentIndex >= 0 && index < currentIndex;
        const minPoints = rule.min_total_points ?? 0;
        const multiplier = rule.point_multiplier;
        return (
          <View
            key={rule.id}
            className={`rounded-2xl border p-4 flex-row items-center gap-3 ${
              isCurrent
                ? "border-2 border-primary bg-secondary"
                : "border-border bg-card"
            }`}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: `${presentation.accentColor}22` }}
            >
              <Icon
                size={20}
                color={presentation.accentColor}
                strokeWidth={2.4}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 flex-wrap">
                <Text
                  className={`text-sm font-bold ${
                    isCurrent ? "text-primary" : "text-foreground"
                  }`}
                >
                  {TIER_PRESENTATION[tierName]?.label ?? rule.tier_name}
                </Text>
                {isCurrent ? (
                  <View className="rounded-full bg-primary px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-white">
                      Hiện tại
                    </Text>
                  </View>
                ) : isPassed ? (
                  <Text className="text-[11px] text-muted-foreground">
                    Đã đạt
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Từ {minPoints.toLocaleString("vi-VN")} điểm trở lên
              </Text>
              <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-1">
                {typeof multiplier === "number" ? (
                  <Text className="text-[11px] text-muted-foreground">
                    Hệ số x{multiplier}
                  </Text>
                ) : null}
                {typeof rule.booking_window_days === "number" ? (
                  <Text className="text-[11px] text-muted-foreground">
                    Đặt trước {rule.booking_window_days} ngày
                  </Text>
                ) : null}
                {typeof rule.max_upcoming_bookings === "number" ? (
                  <Text className="text-[11px] text-muted-foreground">
                    Tối đa {rule.max_upcoming_bookings} lịch
                  </Text>
                ) : null}
                {typeof rule.priority_level === "number" ? (
                  <Text className="text-[11px] text-muted-foreground">
                    Ưu tiên cấp {rule.priority_level}
                  </Text>
                ) : null}
              </View>
            </View>
            <ChevronRight
              size={16}
              color={isCurrent ? presentation.accentColor : "#7a8599"}
              strokeWidth={2.8}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function RewardsScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useApp();
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [tierRules, setTierRules] = useState<LoyaltyTierRule[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    if (!isAuthenticated || !accessToken) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const query: Record<string, QueryValue> = {
        limit: 30,
      };

      const [summaryResponse, transactionsResponse, rulesResponse, promoResponse] =
        await Promise.allSettled([
          api.getLoyaltySummary(accessToken),
          api.getLoyaltyTransactions(accessToken),
          api.getLoyaltyTierRules(accessToken),
          api.getPromotions(query),
        ]);

      if (summaryResponse.status === "fulfilled") {
        setSummary(summaryResponse.value.data);
      }
      if (transactionsResponse.status === "fulfilled") {
        setTransactions(transactionsResponse.value.data ?? []);
      }
      if (rulesResponse.status === "fulfilled") {
        setTierRules(rulesResponse.value.data ?? []);
      }
      if (promoResponse.status === "fulfilled") {
        setPromotions(promoResponse.value.data ?? []);
      }

      const firstRejection = [
        summaryResponse,
        transactionsResponse,
        rulesResponse,
      ].find((res) => res.status === "rejected");
      if (firstRejection && firstRejection.status === "rejected") {
        const reason = firstRejection.reason;
        const message =
          reason instanceof ApiError
            ? reason.message
            : "Không thể tải điểm thưởng.";
        setLoadError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentTier = useMemo(
    () => normalizeTier(summary?.loyalty?.current_tier),
    [summary?.loyalty?.current_tier]
  );
  const nextRule = useMemo(
    () => nextTierRule(currentTier, tierRules),
    [currentTier, tierRules]
  );

  const activePromotions = useMemo(
    () =>
      promotions
        .filter(
          (promotion) =>
            isActivePromotion(promotion) &&
            isPromotionAvailableForTier(promotion, currentTier)
        )
        .slice(0, 8),
    [currentTier, promotions]
  );

  const handleUsePromotion = useCallback(
    (promo: Promotion) => {
      Alert.alert(
        "Áp dụng mã khuyến mãi",
        `Để dùng mã ${promo.code}, hãy tiếp tục đặt lịch từ trang chính và nhập mã này ở bước thanh toán.`,
        [
          { text: "Để sau", style: "cancel" },
          {
            text: "Đặt lịch ngay",
            onPress: () => router.push("/(tabs)/booking"),
          },
        ]
      );
    },
    [router]
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Điểm thưởng của bạn"
          description="Đăng nhập để xem điểm tích lũy, hạng thành viên và lịch sử cộng/trừ điểm."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          loading
          title="Đang tải điểm thưởng"
          description="Đang lấy dữ liệu điểm thưởng của bạn."
        />
      </SafeAreaView>
    );
  }

  if (loadError && !summary) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Không thể tải dữ liệu"
          description={loadError}
          actionLabel="Thử lại"
          onAction={() => {
            setLoading(true);
            void loadData();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
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
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row items-center gap-2">
            <Sparkles size={18} color="#1a56db" strokeWidth={2.4} />
            <Text className="text-3xl font-bold text-foreground">
              Điểm thưởng
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground mt-2">
            Theo dõi hạng thành viên và các ưu đãi có thể áp dụng.
          </Text>
        </View>

        <TierProgressCard
          account={summary?.loyalty ?? null}
          currentTier={currentTier}
          nextRule={nextRule}
        />

        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Gift size={18} color="#1a56db" strokeWidth={2.4} />
              <Text className="text-base font-bold text-foreground">
                Khuyến mãi có thể dùng
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/booking")}>
              <Text className="text-xs font-semibold text-primary">Đặt lịch</Text>
            </TouchableOpacity>
          </View>

          {activePromotions.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-5 items-center">
              <Ticket size={20} color="#8a96a8" strokeWidth={2.2} />
              <Text className="text-sm text-muted-foreground mt-2 text-center">
                Hiện chưa có mã khuyến mãi nào khả dụng. Quay lại sau nhé.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {activePromotions.map((promotion) => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  onApply={handleUsePromotion}
                />
              ))}
            </View>
          )}
        </View>

        <View className="mx-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Award size={18} color="#1a56db" strokeWidth={2.4} />
            <Text className="text-base font-bold text-foreground">
              Cấp bậc thành viên
            </Text>
          </View>
          <TierLadder rules={tierRules} currentTier={currentTier} />
        </View>

        <View className="mx-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <History size={18} color="#1a56db" strokeWidth={2.4} />
            <Text className="text-base font-bold text-foreground">
              Lịch sử điểm
            </Text>
          </View>

          {transactions.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-5 items-center">
              <Text className="text-sm text-muted-foreground text-center">
                Chưa có giao dịch điểm nào. Hoàn thành lịch rửa xe để nhận điểm
                nhé.
              </Text>
            </View>
          ) : (
            <View className="rounded-2xl border border-border bg-card overflow-hidden">
              {transactions.map((transaction, index) => {
                const positive = transaction.points >= 0;
                return (
                  <View
                    key={transaction.id}
                    className={`px-4 py-3 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text
                          className="text-sm font-semibold text-foreground"
                          numberOfLines={1}
                        >
                          {translateTransactionDescription(transaction)}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {transaction.type
                            ? `${TRANSACTION_TYPE_LABEL[transaction.type] ?? "Giao dịch điểm"} · ${formatDateTime(transaction.created_at)}`
                            : formatDateTime(transaction.created_at)}
                        </Text>
                      </View>
                      <Text
                        className={`text-base font-bold ${
                          positive ? "text-primary" : "text-danger"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {transaction.points.toLocaleString("vi-VN")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

void pickPresentation;
