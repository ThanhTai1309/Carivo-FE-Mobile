import { useCallback, useEffect, useState } from "react";
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
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  CircleHelp,
  Clock,
  Info,
  LifeBuoy,
  SearchX,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import SkeletonCard from "@/components/common/SkeletonCard";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { CustomerCase, CustomerCaseStatus } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED: { label: "Vừa gửi", color: "#1a5fd4", bg: "#dbe7fb" },
  ACKNOWLEDGED: { label: "Đã tiếp nhận", color: "#7c3aed", bg: "#ede9fe" },
  INVESTIGATING: { label: "Đang xử lý", color: "#a16207", bg: "#fef3c7" },
  RESOLVED: { label: "Đã giải quyết", color: "#15803d", bg: "#dcfce7" },
  CLOSED: { label: "Đã đóng", color: "#475569", bg: "#f1f5f9" },
};

const CATEGORY_LABEL: Record<string, string> = {
  VEHICLE_DAMAGE: "Hư hỏng xe",
  MISSING_PROPERTY: "Thiếu đồ",
  SERVICE_QUALITY: "Chất lượng dịch vụ",
  SERVICE_INCOMPLETE: "Dịch vụ chưa hoàn tất",
  BILLING_PAYMENT: "Thanh toán",
  STAFF_CONDUCT: "Thái độ nhân viên",
  SAFETY_CONCERN: "An toàn",
  OTHER: "Khác",
};

function SupportScreen() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isHydrated } = useApp();
  const [cases, setCases] = useState<CustomerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    CustomerCaseStatus | "ALL"
  >("ALL");

  const loadCases = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.getMyCustomerCases(accessToken, {
        limit: 50,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      });
      setCases(response.data ?? []);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể tải danh sách hỗ trợ.";
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    if (isHydrated) {
      void loadCases();
    }
  }, [isHydrated, loadCases]);

  if (!isHydrated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Hỗ trợ & Khiếu nại"
          description="Đăng nhập để gửi và theo dõi các yêu cầu hỗ trợ."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  const FILTERS: { value: CustomerCaseStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "SUBMITTED", label: "Vừa gửi" },
    { value: "ACKNOWLEDGED", label: "Tiếp nhận" },
    { value: "INVESTIGATING", label: "Đang xử lý" },
    { value: "RESOLVED", label: "Hoàn tất" },
  ];

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
            Hỗ trợ & Khiếu nại
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Theo dõi phản hồi từ Carivo
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View className="mx-4 mb-3 rounded-2xl bg-blue-50 border border-blue-200 p-4 flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center">
          <Info size={18} color="#1a5fd4" strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-blue-800">
            Cần gửi yêu cầu mới?
          </Text>
          <Text className="text-xs text-blue-700 mt-1 leading-5">
            Yêu cầu hỗ trợ được tạo tự động khi bạn báo cáo vấn đề ngay tại
            màn hình bàn giao xe, hoặc khi staff garage ghi nhận cho bạn. Hãy
            theo dõi các yêu cầu bên dưới.
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              activeOpacity={0.85}
              className={`px-3 py-2 rounded-full border ${
                active
                  ? "bg-primary border-primary"
                  : "bg-card border-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-foreground"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1 mt-3"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadCases();
            }}
          />
        }
      >
        <View className="px-4 gap-3">
          {loading ? (
            <View className="gap-3">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
          ) : cases.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center gap-2">
              <SearchX size={26} color="#94a3b8" strokeWidth={1.6} />
              <Text className="text-sm font-semibold text-foreground">
                Chưa có yêu cầu hỗ trợ
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                {statusFilter === "ALL"
                  ? "Các yêu cầu bạn gửi sẽ hiển thị tại đây."
                  : "Không có yêu cầu nào ở trạng thái này."}
              </Text>
            </View>
          ) : (
            cases.map((c) => {
              const statusStyle = STATUS_LABEL[c.status] ?? STATUS_LABEL.SUBMITTED;
              const categoryLabel = CATEGORY_LABEL[c.category] ?? c.category;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/support/cases/[id]",
                      params: { id: c.id },
                    })
                  }
                  className="rounded-2xl bg-card border border-border p-4"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text
                        className="text-sm font-bold text-foreground"
                        numberOfLines={1}
                      >
                        {caseTitle(c)}
                      </Text>
                      <View className="flex-row items-center gap-1 mt-1">
                        <LifeBuoy
                          size={12}
                          color="#7a8599"
                          strokeWidth={2.2}
                        />
                        <Text className="text-xs text-muted-foreground">
                          {categoryLabel}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          • {c.case_code ?? c.id.slice(0, 8).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{ backgroundColor: statusStyle.bg }}
                      className="px-2 py-1 rounded-full self-start"
                    >
                      <Text
                        style={{ color: statusStyle.color }}
                        className="text-[10px] font-bold"
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>
                  {c.description ? (
                    <Text
                      className="text-xs text-muted-foreground mt-2 leading-5"
                      numberOfLines={2}
                    >
                      {c.description}
                    </Text>
                  ) : null}
                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center gap-1">
                      <CalendarClock
                        size={12}
                        color="#7a8599"
                        strokeWidth={2.2}
                      />
                      <Text className="text-[11px] text-muted-foreground">
                        {formatDateTime(c.created_at)}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#94a3b8" strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function caseTitle(c: CustomerCase) {
  const cat =
    c.category === "VEHICLE_DAMAGE"
      ? "Hư hỏng xe"
      : c.category === "MISSING_PROPERTY"
      ? "Thiếu đồ"
      : c.category === "SERVICE_QUALITY"
      ? "Chất lượng dịch vụ"
      : c.category === "SERVICE_INCOMPLETE"
      ? "Dịch vụ chưa hoàn tất"
      : c.category === "BILLING_PAYMENT"
      ? "Thanh toán"
      : c.category === "STAFF_CONDUCT"
      ? "Thái độ nhân viên"
      : c.category === "SAFETY_CONCERN"
      ? "An toàn"
      : c.category === "OTHER"
      ? "Khác"
      : "Yêu cầu hỗ trợ";
  return cat;
}

export default function SupportScreenWithBoundary() {
  return (
    <ErrorBoundary fallbackTitle="L?i trang h? tr?">
      <SupportScreen />
    </ErrorBoundary>
  );
}
