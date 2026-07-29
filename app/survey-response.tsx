import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  CircleSlash,
  ClipboardList,
  Coins,
  Send,
  Star,
  ThumbsUp,
} from "lucide-react-native";
import ScreenState from "@/components/common/ScreenState";
import { api, ApiError } from "@/lib/api";
import type { Survey, SurveyQuestion } from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

function RatingPicker({
  value,
  onChange,
  size = 32,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value >= n;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Đánh giá ${n} sao`}
          >
            <Star
              size={size}
              color={active ? "#f59e0b" : "#cbd5e1"}
              strokeWidth={2}
              fill={active ? "#f59e0b" : "transparent"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ChoicePicker({
  options,
  selected,
  onChange,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onChange: (next: string | string[]) => void;
  multi?: boolean;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  const toggle = (v: string) => {
    if (multi) {
      const current = (selected as string[]) ?? [];
      const next = current.includes(v)
        ? current.filter((x) => x !== v)
        : [...current, v];
      onChange(next);
    } else {
      onChange(v);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = isSelected(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => toggle(opt)}
            className={`rounded-full px-4 py-2 border ${
              active
                ? "bg-primary border-primary"
                : "bg-card border-border"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-white" : "text-foreground"
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SurveyResponseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    surveyId?: string;
  }>();
  const { accessToken, isAuthenticated } = useApp();

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const bookingId = params.bookingId;

  const loadSurveys = useCallback(async () => {
    if (!accessToken || !bookingId) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.getAvailableSurveys(accessToken, bookingId);
      const list = response.data ?? [];
      setSurveys(list);
      if (list.length === 1) {
        setActiveSurvey(list[0]);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể tải khảo sát.";
      Alert.alert("Lỗi", message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, bookingId]);

  useEffect(() => {
    void loadSurveys();
  }, [loadSurveys]);

  const requiredQuestions = useMemo(() => {
    if (!activeSurvey) return [];
    return activeSurvey.questions.filter((q) => q.is_required);
  }, [activeSurvey]);

  const isValid = useMemo(() => {
    if (!activeSurvey) return false;
    return requiredQuestions.every((q) => {
      const value = answers[q.id];
      if (q.type === "RATING") {
        return typeof value === "number" && value > 0;
      }
      if (q.type === "NPS") {
        return typeof value === "number";
      }
      if (q.type === "TEXT") {
        return typeof value === "string" && value.trim().length > 0;
      }
      if (q.type === "MULTI_CHOICE") {
        return Array.isArray(value) && value.length > 0;
      }
      if (q.type === "SINGLE_CHOICE") {
        return typeof value === "string" && value.length > 0;
      }
      return value !== undefined && value !== null;
    });
  }, [activeSurvey, answers, requiredQuestions]);

  const handleSubmit = async () => {
    if (!activeSurvey || !bookingId || !accessToken) return;
    if (!isValid) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng trả lời các câu hỏi bắt buộc."
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        booking_id: bookingId,
        answers: activeSurvey.questions.map((q) => ({
          question_id: q.id,
          value: answers[q.id] ?? null,
        })),
      };
      const response = await api.submitSurveyResponse(
        accessToken,
        activeSurvey.id,
        payload
      );
      const awardedPoints = response.data.reward?.points ?? 0;
      Alert.alert(
        "Cảm ơn bạn!",
        awardedPoints > 0
          ? `Phản hồi đã được ghi nhận và ${awardedPoints} điểm thưởng đã được cộng vào tài khoản.`
          : "Phản hồi đã được ghi nhận. Carivo sẽ dùng đánh giá của bạn để cải thiện dịch vụ.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Không thể gửi đánh giá.";
      Alert.alert("Lỗi", message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const value = answers[question.id];

    const updateAnswer = (next: unknown) => {
      setAnswers((prev) => ({ ...prev, [question.id]: next }));
    };

    return (
      <View
        key={question.id}
        className="rounded-2xl bg-card border border-border p-4 gap-3"
      >
        <View className="flex-row items-start gap-2">
          <Text className="text-sm font-semibold text-foreground flex-1 leading-relaxed">
            {question.text}
          </Text>
          {question.is_required ? (
            <View className="rounded-full bg-red-50 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-red-700">
                BẮT BUỘC
              </Text>
            </View>
          ) : null}
        </View>

        {question.type === "RATING" ? (
          <View>
            <RatingPicker
              value={typeof value === "number" ? value : 0}
              onChange={updateAnswer}
            />
            <Text className="text-xs text-muted-foreground mt-1">
              {typeof value === "number" && value > 0
                ? `Bạn đã chọn ${value} sao`
                : "Chạm để chọn số sao"}
            </Text>
          </View>
        ) : null}

        {question.type === "NPS" ? (
          <View>
            <View className="flex-row flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => {
                const active = value === n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => updateAnswer(n)}
                    className={`w-9 h-9 rounded-lg items-center justify-center ${
                      active ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        active ? "text-white" : "text-foreground"
                      }`}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-[10px] text-muted-foreground">
                Rất không hài lòng
              </Text>
              <Text className="text-[10px] text-muted-foreground">
                Rất hài lòng
              </Text>
            </View>
          </View>
        ) : null}

        {question.type === "SINGLE_CHOICE" ? (
          <ChoicePicker
            options={question.options ?? []}
            selected={typeof value === "string" ? value : ""}
            onChange={(v) => updateAnswer(v)}
            multi={false}
          />
        ) : null}

        {question.type === "MULTI_CHOICE" ? (
          <ChoicePicker
            options={question.options ?? []}
            selected={Array.isArray(value) ? (value as string[]) : []}
            onChange={(v) => updateAnswer(v)}
            multi={true}
          />
        ) : null}

        {question.type === "TEXT" ? (
          <TextInput
            value={typeof value === "string" ? value : ""}
            onChangeText={(t) => updateAnswer(t)}
            placeholder="Nhập phản hồi của bạn..."
            placeholderTextColor="#94a3b8"
            multiline
            className="rounded-xl border border-border bg-input px-3 py-3 text-foreground min-h-[100px]"
            textAlignVertical="top"
          />
        ) : null}
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Khảo sát"
          description="Đăng nhập để gửi đánh giá dịch vụ."
          actionLabel="Đăng nhập"
          onAction={() => router.push("/login")}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải khảo sát" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-card items-center justify-center"
        >
          <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-base font-bold text-foreground">
            Đánh giá dịch vụ
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Carivo sẽ dùng phản hồi của bạn để cải thiện chất lượng
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 gap-3">
          {surveys.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-card p-6 items-center gap-2">
              <ThumbsUp size={28} color="#94a3b8" strokeWidth={1.6} />
              <Text className="text-sm font-semibold text-foreground">
                Hiện không có khảo sát nào
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                Có thể bạn đã hoàn tất khảo sát cho lịch hẹn này, hoặc khảo sát
                chưa được mở.
              </Text>
            </View>
          ) : null}

          {surveys.length > 1 && !activeSurvey ? (
            <View className="gap-3">
              <Text className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Chọn khảo sát
              </Text>
              {surveys.map((survey) => (
                <TouchableOpacity
                  key={survey.id}
                  onPress={() => setActiveSurvey(survey)}
                  className="rounded-2xl bg-card border border-border p-4 flex-row gap-3 items-center"
                >
                  <View className="w-12 h-12 rounded-xl bg-secondary items-center justify-center">
                    <ClipboardList size={22} color="#1a56db" strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">
                      {survey.title}
                    </Text>
                    {survey.description ? (
                      <Text
                        className="text-xs text-muted-foreground mt-1"
                        numberOfLines={2}
                      >
                        {survey.description}
                      </Text>
                    ) : null}
                    <Text className="text-[11px] text-muted-foreground mt-1">
                      {survey.questions.length} câu hỏi
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {activeSurvey ? (
            <View className="gap-3">
              {/* Survey header */}
              <View className="rounded-2xl bg-primary p-4">
                <Text className="text-xs text-white/80 font-semibold tracking-wider uppercase">
                  KHẢO SÁT
                </Text>
                <Text className="text-lg font-bold text-white mt-1">
                  {activeSurvey.title}
                </Text>
                {activeSurvey.description ? (
                  <Text className="text-xs text-white/80 mt-1 leading-relaxed">
                    {activeSurvey.description}
                  </Text>
                ) : null}
                {(activeSurvey.reward_points ?? 0) > 0 ? (
                  <View className="mt-3 self-start flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                    <Coins size={14} color="#ffffff" strokeWidth={2.2} />
                    <Text className="text-xs font-bold text-white">
                      Hoàn thành nhận {activeSurvey.reward_points} điểm
                    </Text>
                  </View>
                ) : null}
              </View>

              {surveys.length > 1 ? (
                <TouchableOpacity
                  onPress={() => {
                    setActiveSurvey(null);
                    setAnswers({});
                  }}
                  className="flex-row items-center gap-1.5 self-start"
                >
                  <CircleSlash size={14} color="#1a5fd4" strokeWidth={2.4} />
                  <Text className="text-xs text-primary font-semibold">
                    Chọn khảo sát khác
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Questions */}
              {[...activeSurvey.questions]
                .sort((a, b) => a.order - b.order)
                .map(renderQuestion)}

              {/* Submit */}
              <TouchableOpacity
                onPress={() => void handleSubmit()}
                disabled={!isValid || submitting}
                activeOpacity={0.85}
                className={`mt-2 rounded-xl py-4 flex-row items-center justify-center gap-2 ${
                  isValid ? "bg-primary" : "bg-muted"
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text
                      className={`font-bold text-base ${
                        isValid ? "text-white" : "text-muted-foreground"
                      }`}
                    >
                      Gửi khảo sát
                    </Text>
                    <Send
                      size={18}
                      color={isValid ? "#ffffff" : "#7a8599"}
                      strokeWidth={2.4}
                    />
                  </>
                )}
              </TouchableOpacity>

              {isValid ? (
                <View className="flex-row items-center gap-2 self-center mt-1">
                  <Check size={14} color="#15803d" strokeWidth={2.6} />
                  <Text className="text-xs text-emerald-700 font-semibold">
                    Sẵn sàng gửi
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
