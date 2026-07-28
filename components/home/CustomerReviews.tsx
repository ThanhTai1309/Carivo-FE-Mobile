import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Star, Quote, ChevronRight } from "lucide-react-native";

interface ReviewItem {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: "1",
    name: "Nguyễn Văn Minh",
    vehicle: "Toyota Camry 2023",
    rating: 5,
    comment: "Dịch vụ rửa xe tuyệt vời! Xe sạch bóng, nhân viên nhiệt tình. Đặc biệt phần dọn nội thất kỹ lắm, ghế da sáng bóng như mới. Sẽ quay lại lần sau!",
    date: "28/07/2026",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Minh",
  },
  {
    id: "2",
    name: "Trần Thị Lan",
    vehicle: "Honda Civic 2024",
    rating: 5,
    comment: "Lần đầu trải nghiệm phủ Ceramic tại đây và rất hài lòng. Sơn xe bóng mượt, nhân viên tư vấn nhiệt tình về cách bảo quản sau phủ. Giá cả hợp lý!",
    date: "27/07/2026",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lan",
  },
  {
    id: "3",
    name: "Lê Hoàng Nam",
    vehicle: "Mercedes C300",
    rating: 4,
    comment: "Garage sang trọng, trang thiết bị hiện đại. Nhân viên chuyên nghiệp, kiểm tra xe kỹ trước và sau khi rửa. Điểm trừ nhỏ là thời gian chờ hơi lâu giờ cao điểm.",
    date: "26/07/2026",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nam",
  },
  {
    id: "4",
    name: "Phạm Thu Hà",
    vehicle: "BMW 320i",
    rating: 5,
    comment: "Combo Gia Đình thật sự xứng đáng! Tiết kiệm được 22% mà dịch vụ đầy đủ. Khử trùng ozone bên trong xe rất tốt, mùi thơm dịu nhẹ. Highly recommended!",
    date: "25/07/2026",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hà",
  },
];

interface CustomerReviewsProps {
  onSelect?: (review: ReviewItem) => void;
}

export default function CustomerReviews({ onSelect }: CustomerReviewsProps) {
  return (
    <View className="mt-8">
      <View className="px-4 flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-6 rounded-full bg-amber-500" />
          <Text className="font-bold text-xl text-foreground">Đánh giá khách hàng</Text>
        </View>
        <TouchableOpacity onPress={() => {}} className="flex-row items-center gap-1">
          <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
          <ChevronRight size={14} color="#1a5fd4" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      >
        {REVIEWS.map((review) => (
          <TouchableOpacity
            key={review.id}
            onPress={() => onSelect?.(review)}
            activeOpacity={0.85}
            className="w-80 mr-4 bg-card rounded-2xl border border-border p-5"
          >
            {/* Header with avatar */}
            <View className="flex-row items-start gap-3 mb-3">
              <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center overflow-hidden">
                <Text className="text-lg font-bold text-primary">
                  {review.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground">{review.name}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {review.vehicle}
                </Text>
                <View className="flex-row items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      color={n <= review.rating ? "#f59e0b" : "#d1d5db"}
                      strokeWidth={1.5}
                      fill={n <= review.rating ? "#f59e0b" : "transparent"}
                    />
                  ))}
                </View>
              </View>
              <Text className="text-[10px] text-muted-foreground">{review.date}</Text>
            </View>

            {/* Quote icon */}
            <View className="mb-2">
              <Quote size={20} color="#1a5fd4" strokeWidth={1.5} />
            </View>

            {/* Comment */}
            <Text
              className="text-sm text-foreground leading-relaxed"
              numberOfLines={4}
            >
              {review.comment}
            </Text>

            {/* Read more hint */}
            <Text className="text-xs text-primary mt-3 font-medium">Đọc thêm →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export { REVIEWS };
