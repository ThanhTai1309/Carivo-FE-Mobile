import { Building2, MessageSquareReply, ShieldAlert } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";
import RatingStars from "@/components/reviews/RatingStars";
import {
  getModerationLabel,
  getModerationReasonLabel,
} from "@/lib/review";
import type { GarageReview } from "@/lib/types";

export default function ReviewCard({
  review,
  showSubject = false,
  showModeration = false,
  onPress,
}: {
  review: GarageReview;
  showSubject?: boolean;
  showModeration?: boolean;
  onPress?: () => void;
}) {
  const customerName = review.is_anonymous
    ? "Khách hàng ẩn danh"
    : review.customer?.full_name || "Khách hàng";
  const garageRating = review.garage_rating ?? review.rating ?? 0;
  const serviceRating = review.service_rating ?? review.rating ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Text className="text-sm font-bold text-primary">
            {customerName.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">
                {customerName}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            {showModeration ? (
              <View
                className={`rounded-full px-2.5 py-1 ${
                  review.moderation_status === "HIDDEN"
                    ? "bg-red-50"
                    : "bg-emerald-50"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    review.moderation_status === "HIDDEN"
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  {getModerationLabel(review.moderation_status)}
                </Text>
              </View>
            ) : null}
          </View>
          {showSubject ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Building2 size={12} color="#64748b" strokeWidth={2} />
              <Text
                className="flex-1 text-xs text-muted-foreground"
                numberOfLines={1}
              >
                {review.garage?.name || "Garage"} ·{" "}
                {review.service_package?.name || "Dịch vụ"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="mt-3 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-muted-foreground">Garage</Text>
          <RatingStars value={garageRating} size={14} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-muted-foreground">Dịch vụ</Text>
          <RatingStars value={serviceRating} size={14} />
        </View>
      </View>

      {review.comment ? (
        <Text className="mt-3 text-sm leading-relaxed text-foreground">
          {review.comment}
        </Text>
      ) : null}

      {review.uploads && review.uploads.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {review.uploads.map((upload) => (
            <Image
              key={upload.id}
              source={{ uri: upload.url }}
              className="h-20 w-20 rounded-xl bg-secondary"
              resizeMode="cover"
            />
          ))}
        </View>
      ) : null}

      {review.moderation_status === "HIDDEN" && showModeration ? (
        <View className="mt-3 flex-row items-start gap-2 rounded-xl bg-red-50 p-3">
          <ShieldAlert size={16} color="#b91c1c" strokeWidth={2.2} />
          <View className="flex-1">
            <Text className="text-xs font-bold text-red-800">
              {getModerationReasonLabel(review.moderation_reason)}
            </Text>
            {review.moderation_note ? (
              <Text className="mt-1 text-xs text-red-700">
                {review.moderation_note}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {review.garage_reply ? (
        <View className="mt-3 rounded-xl bg-blue-50 p-3">
          <View className="flex-row items-center gap-2">
            <MessageSquareReply size={15} color="#1d4ed8" strokeWidth={2.2} />
            <Text className="text-xs font-bold text-blue-800">
              Phản hồi chính thức từ garage
            </Text>
          </View>
          <Text className="mt-1.5 text-xs leading-relaxed text-blue-900">
            {review.garage_reply.content}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
