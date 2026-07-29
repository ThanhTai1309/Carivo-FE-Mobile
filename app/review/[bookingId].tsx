import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  Coins,
  EyeOff,
  ImagePlus,
  Save,
  Trash2,
  X,
} from "lucide-react-native";
import LoadingButton from "@/components/common/LoadingButton";
import ScreenState from "@/components/common/ScreenState";
import RatingStars from "@/components/reviews/RatingStars";
import ReviewCard from "@/components/reviews/ReviewCard";
import { api } from "@/lib/api";
import {
  getReviewEligibilityMessage,
  getReviewErrorMessage,
} from "@/lib/review";
import type {
  GarageReview,
  ReviewEligibility,
  ReviewUpload,
} from "@/lib/types";
import { useApp } from "@/providers/AppProvider";

interface PendingImage {
  uri: string;
  mimeType: string;
}

export default function BookingReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  const {
    accessToken,
    isAuthenticated,
    isHydrated,
    uploadImage,
  } = useApp();
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [review, setReview] = useState<GarageReview | null>(null);
  const [garageRating, setGarageRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [retainedUploads, setRetainedUploads] = useState<ReviewUpload[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const applyReview = useCallback((value: GarageReview | null) => {
    setReview(value);
    setGarageRating(value?.garage_rating ?? 0);
    setServiceRating(value?.service_rating ?? 0);
    setComment(value?.comment ?? "");
    setIsAnonymous(value?.is_anonymous ?? false);
    setRetainedUploads(value?.uploads ?? []);
    setPendingImages([]);
  }, []);

  const load = useCallback(async () => {
    if (!accessToken || !bookingId) return;
    setLoading(true);
    try {
      const response = await api.getReviewEligibility(accessToken, bookingId);
      setEligibility(response.data);
      applyReview(response.data.review ?? null);
    } catch (error) {
      Alert.alert("Không thể tải đánh giá", getReviewErrorMessage(error));
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, applyReview, bookingId]);

  useEffect(() => {
    if (isHydrated && isAuthenticated && bookingId) {
      void load();
    }
  }, [bookingId, isAuthenticated, isHydrated, load]);

  const handlePickImages = async () => {
    const remaining = 5 - retainedUploads.length - pendingImages.length;
    if (remaining <= 0) {
      Alert.alert("Đã đủ ảnh", "Mỗi đánh giá được đính kèm tối đa 5 ảnh.");
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Quyền truy cập ảnh",
        "Cần cấp quyền truy cập thư viện để đính kèm ảnh đánh giá."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled) return;
    setPendingImages((current) => [
      ...current,
      ...result.assets.slice(0, remaining).map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
      })),
    ]);
  };

  const handleSubmit = async () => {
    if (!accessToken || !bookingId) return;
    if (garageRating < 1 || serviceRating < 1) {
      Alert.alert(
        "Thiếu số sao",
        "Vui lòng chấm điểm cả chất lượng garage và chất lượng dịch vụ."
      );
      return;
    }

    setSubmitting(true);
    const newUploadIds: string[] = [];
    try {
      for (const image of pendingImages) {
        const uploaded = await uploadImage(
          image.uri,
          image.mimeType,
          "REVIEW"
        );
        newUploadIds.push(uploaded.id);
      }

      const payload = {
        garage_rating: garageRating,
        service_rating: serviceRating,
        comment: comment.trim() || null,
        upload_ids: [
          ...retainedUploads.map((upload) => upload.id),
          ...newUploadIds,
        ],
        is_anonymous: isAnonymous,
      };

      const response = review
        ? await api.updateMyReview(accessToken, review.id, payload)
        : await api.createReview(accessToken, {
            booking_id: bookingId,
            ...payload,
          });

      applyReview(response.data);
      setEligibility({
        eligible: false,
        reason_code: "REVIEW_ALREADY_EXISTS",
        review: response.data,
      });
      Alert.alert(
        "Đã lưu đánh giá",
        review
          ? "Đánh giá của bạn đã được cập nhật."
          : (response.data.reward?.points ?? 0) > 0
            ? `Cảm ơn bạn đã chia sẻ trải nghiệm. ${response.data.reward?.points} điểm thưởng đã được cộng vào tài khoản.`
            : "Cảm ơn bạn đã chia sẻ trải nghiệm."
      );
    } catch (error) {
      if (newUploadIds.length > 0) {
        await Promise.allSettled(
          newUploadIds.map((id) => api.deleteUpload(accessToken, id))
        );
      }
      Alert.alert("Không thể lưu đánh giá", getReviewErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!accessToken || !review) return;
    Alert.alert(
      "Xóa đánh giá",
      "Đánh giá sẽ không còn công khai và không thể tạo lại cho booking này.",
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Xóa đánh giá",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const response = await api.deleteMyReview(
                accessToken,
                review.id
              );
              applyReview(response.data);
              setEligibility({
                eligible: false,
                reason_code: "REVIEW_ALREADY_DELETED",
                review: response.data,
              });
              Alert.alert("Đã xóa", "Đánh giá đã được xóa khỏi hệ thống.");
            } catch (error) {
              Alert.alert(
                "Không thể xóa đánh giá",
                getReviewErrorMessage(error)
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!isHydrated || loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState loading title="Đang tải đánh giá" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScreenState
          title="Cần đăng nhập"
          description="Đăng nhập để đánh giá booking của bạn."
          actionLabel="Đăng nhập"
          onAction={() => router.replace("/login")}
        />
      </SafeAreaView>
    );
  }

  const isDeleted =
    eligibility?.reason_code === "REVIEW_ALREADY_DELETED" ||
    Boolean(review?.deleted_at);
  const canEdit = Boolean(eligibility?.eligible || (review && !isDeleted));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-card"
        >
          <ArrowLeft size={20} color="#111827" strokeWidth={2.2} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            {review ? "Đánh giá của bạn" : "Đánh giá trải nghiệm"}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Booking {bookingId.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {!canEdit ? (
          <View className="gap-4">
            {review ? (
              <ReviewCard review={review} showSubject showModeration />
            ) : null}
            <View className="items-center rounded-2xl border border-border bg-card p-6">
              <EyeOff size={28} color="#64748b" strokeWidth={1.8} />
              <Text className="mt-3 text-center text-base font-bold text-foreground">
                Chưa thể đánh giá
              </Text>
              <Text className="mt-1 text-center text-sm leading-relaxed text-muted-foreground">
                {getReviewEligibilityMessage(eligibility?.reason_code)}
              </Text>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            {!review && (eligibility?.context?.reward_points ?? 0) > 0 ? (
              <View className="flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Coins size={20} color="#b45309" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-amber-900">
                    Nhận {eligibility?.context?.reward_points} điểm thưởng
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-amber-800">
                    Điểm được tặng khi bạn chấm cả garage và dịch vụ, không phụ thuộc số sao.
                  </Text>
                </View>
              </View>
            ) : null}

            {review?.reward?.awarded ? (
              <View className="flex-row items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <Coins size={18} color="#047857" strokeWidth={2.2} />
                <Text className="flex-1 text-sm font-semibold text-emerald-800">
                  Đã nhận {review.reward.points} điểm cho đánh giá này
                </Text>
              </View>
            ) : null}

            {review?.moderation_status === "HIDDEN" ? (
              <ReviewCard review={review} showSubject showModeration />
            ) : null}

            <View className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-base font-bold text-foreground">
                Chất lượng garage
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                Không gian, quy trình tiếp nhận và thái độ phục vụ
              </Text>
              <View className="mt-3">
                <RatingStars
                  value={garageRating}
                  onChange={setGarageRating}
                  size={30}
                />
              </View>
            </View>

            <View className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-base font-bold text-foreground">
                Chất lượng dịch vụ
              </Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                Kết quả chăm sóc xe so với dịch vụ đã đặt
              </Text>
              <View className="mt-3">
                <RatingStars
                  value={serviceRating}
                  onChange={setServiceRating}
                  size={30}
                />
              </View>
            </View>

            <View className="rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-foreground">
                  Bình luận
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {comment.length}/2000
                </Text>
              </View>
              <TextInput
                value={comment}
                onChangeText={(value) => setComment(value.slice(0, 2000))}
                multiline
                textAlignVertical="top"
                placeholder="Chia sẻ điều bạn hài lòng hoặc cần garage cải thiện..."
                placeholderTextColor="#94a3b8"
                className="mt-3 min-h-32 rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground"
              />
            </View>

            <View className="rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <ImagePlus size={17} color="#1a5fd4" strokeWidth={2.2} />
                    <Text className="text-base font-bold text-foreground">
                      Hình ảnh
                    </Text>
                  </View>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    Tối đa 5 ảnh, chỉ dùng ảnh liên quan đến dịch vụ
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => void handlePickImages()}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-secondary"
                >
                  <Camera size={19} color="#1a5fd4" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              {retainedUploads.length + pendingImages.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {retainedUploads.map((upload) => (
                    <View key={upload.id} className="relative">
                      <Image
                        source={{ uri: upload.url }}
                        className="h-24 w-24 rounded-xl bg-secondary"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setRetainedUploads((current) =>
                            current.filter((item) => item.id !== upload.id)
                          )
                        }
                        className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-red-500"
                      >
                        <X size={13} color="#ffffff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {pendingImages.map((image, index) => (
                    <View key={`${image.uri}-${index}`} className="relative">
                      <Image
                        source={{ uri: image.uri }}
                        className="h-24 w-24 rounded-xl bg-secondary"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setPendingImages((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-red-500"
                      >
                        <X size={13} color="#ffffff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  Đánh giá ẩn danh
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Tên và ảnh đại diện của bạn sẽ không hiển thị công khai
                </Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                thumbColor={isAnonymous ? "#1a5fd4" : "#f8fafc"}
              />
            </View>

            <LoadingButton
              title={review ? "Lưu thay đổi" : "Gửi đánh giá"}
              loading={submitting}
              loadingTitle="Đang lưu đánh giá..."
              onPress={handleSubmit}
              icon={Save}
              variant="primary"
            />

            {review ? (
              <LoadingButton
                title="Xóa đánh giá"
                loading={deleting}
                loadingTitle="Đang xóa..."
                onPress={handleDelete}
                icon={Trash2}
                variant="danger"
              />
            ) : null}

            {submitting ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator size="small" color="#1a5fd4" />
                <Text className="text-xs text-muted-foreground">
                  Ảnh sẽ được tải lên trước khi lưu đánh giá
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
