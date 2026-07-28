import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Star,
  ChevronRight,
  Droplets,
  Armchair,
  Sparkles,
  ShieldCheck,
  Car,
  Wrench,
  Check,
} from "lucide-react-native";

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  duration: number;
  rating: number;
  reviewCount: number;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  bgColor: string;
  images: string[];
  steps: { title: string; description: string }[];
  includes: string[];
  addons: { id: string; name: string; price: number }[];
}

const SERVICES_DATA: Record<string, ServiceDetail> = {
  "wash-standard": {
    id: "wash-standard",
    name: "Rửa Tiêu Chuẩn",
    description: "Rửa ngoài, lau khô, kiểm tra nhanh",
    longDescription:
      "Dịch vụ rửa xe tiêu chuẩn giúp xe bạn luôn sạch sẽ và bóng đẹp. Quy trình được thực hiện bài bản với các bước kiểm tra, rửa, xả và lau khô chuyên nghiệp.",
    price: 150000,
    duration: 30,
    rating: 4.8,
    reviewCount: 1230,
    icon: Droplets,
    color: "#0ea5e9",
    bgColor: "#e0f2fe",
    images: [
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    ],
    steps: [
      { title: "Tiếp nhận xe", description: "Nhân viên kiểm tra tình trạng xe và ghi nhận các vấn đề trước khi rửa" },
      { title: "Xịt rửa nước", description: "Xịt nước làm sạch bụi bẩn, bùn đất bám trên bề mặt xe" },
      { title: "Bôi sáp bóng", description: "Thoa đều sáp bóng mờ lên bề mặt sơn xe để tạo lớp bảo vệ" },
      { title: "Xả sạch sáp", description: "Xả nước sạch để loại bỏ sáp bóng thừa" },
      { title: "Lau khô xe", description: "Sử dụng khăn microfiber lau khô toàn bộ bề mặt xe" },
      { title: "Kiểm tra cuối", description: "Kiểm tra lại các vị trí và bàn giao xe cho khách" },
    ],
    includes: [
      "Rửa ngoài thân xe",
      "Lau khô toàn bộ",
      "Kiểm tra áp suất lốp",
      "Lau gương chiếu hậu",
      "Lau kính chắn gió",
    ],
    addons: [
      { id: "addon-interior", name: "Hút bụi nhanh", price: 50000 },
      { id: "addon-tire", name: "Lau dử lốp xe", price: 30000 },
    ],
  },
  "interior": {
    id: "interior",
    name: "Dọn Nội Thất",
    description: "Hút bụi, lau bảng điều khiển, làm sạch ghế",
    longDescription:
      "Dịch vụ dọn nội thất chuyên nghiệp giúp không gian bên trong xe luôn thơm tho và sạch sẽ. Sử dụng các sản phẩm chuyên dụng an toàn cho da và các bề mặt.",
    price: 250000,
    duration: 45,
    rating: 4.7,
    reviewCount: 890,
    icon: Armchair,
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    images: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
    ],
    steps: [
      { title: "Hút bụi toàn bộ", description: "Hút bụi sàn, ghế, cốp và các ngóc ngách trong xe" },
      { title: "Lau bảng điều khiển", description: "Sử dụng dung dịch chuyên dụng lau sạch bảng điều khiển" },
      { title: "Vệ sinh ghế da/nỉ", description: "Làm sạch và dưỡng ghế ngồi" },
      { title: "Lau kính trong", description: "Lau sạch kính từ bên trong" },
      { title: "Xịt khử mùi", description: "Xịt nước hoa xe tạo hương thơm dễ chịu" },
    ],
    includes: [
      "Hút bụi toàn bộ",
      "Lau bảng điều khiển",
      "Vệ sinh ghế ngồi",
      "Lau kính trong xe",
      "Xịt khử mùi",
    ],
    addons: [
      { id: "addon-shampoo", name: "Giặt nỉ/chất liệu", price: 100000 },
      { id: "addon-leather", name: "Dưỡng da ghế", price: 80000 },
    ],
  },
  "ceramic": {
    id: "ceramic",
    name: "Phủ Ceramic Nano",
    description: "Bảo vệ sơn, bóng đẹp lâu dài",
    longDescription:
      "Công nghệ phủ Ceramic Nano tiên tiến giúp tạo lớp bảo vệ cứng chắc trên bề mặt sơn xe, chống trầy xước, chống tia UV và giữ xe luôn bóng đẹp trong thời gian dài.",
    price: 450000,
    duration: 90,
    rating: 4.9,
    reviewCount: 567,
    icon: Sparkles,
    color: "#f59e0b",
    bgColor: "#fef3c7",
    images: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop",
    ],
    steps: [
      { title: "Rửa xe sạch", description: "Rửa và làm sạch hoàn toàn bề mặt sơn" },
      { title: "Clay bar xử lý", description: "Loại bỏ các chất bẩn bám chặt trên sơn" },
      { title: "Đánh bóng sơn", description: "Đánh bóng loại bỏ vết xước nhẹ và oxide" },
      { title: "Sơn lót Ceramic", description: "Phủ lớp sơn lót Ceramic đầu tiên" },
      { title: "Phủ Ceramic chính", description: "Phủ nhiều lớp Ceramic nano lên bề mặt" },
      { title: "Hoàn thiện", description: "Đánh bóng và kiểm tra độ bóng hoàn thiện" },
    ],
    includes: [
      "Rửa xe sạch sẽ",
      "Clay bar xử lý",
      "Đánh bóng sơn",
      "Phủ 3 lớp Ceramic",
      "Bảo hành 12 tháng",
    ],
    addons: [
      { id: "addon-glass", name: "Phủ kính chống nước", price: 200000 },
      { id: "addon-wheel", name: "Phủ Ceramic vành xe", price: 150000 },
    ],
  },
  "sanitize": {
    id: "sanitize",
    name: "Khử Trùng Ozone",
    description: "Khử khuẩn, làm sạch không khí trong xe",
    longDescription:
      "Sử dụng công nghệ Ozone tiên tiến giúp khử trùng triệt để không gian bên trong xe, loại bỏ vi khuẩn, nấm mốc và các tác nhân gây dị ứng, mang lại không khí trong lành.",
    price: 180000,
    duration: 30,
    rating: 4.6,
    reviewCount: 445,
    icon: ShieldCheck,
    color: "#10b981",
    bgColor: "#d1fae5",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=600&fit=crop",
    ],
    steps: [
      { title: "Hút bụi cơ bản", description: "Loại bỏ bụi bẩn và rác trong xe trước khi khử trùng" },
      { title: "Phun dung dịch", description: "Phun dung dịch khử khuẩn lên các bề mặt" },
      { title: "Xử lý Ozone", description: "Bật máy Ozone trong khoang xe để khử trùng" },
      { title: "Thông gió", description: "Mở cửa xe thông gió để loại bỏ mùi Ozone" },
    ],
    includes: [
      "Hút bụi cơ bản",
      "Phun dung dịch khử khuẩn",
      "Xử lý Ozone 30 phút",
      "Thông gió và kiểm tra",
    ],
    addons: [
      { id: "addon-deep", name: "Khử trùng sâu", price: 100000 },
      { id: "addon-ac", name: "Vệ sinh điều hòa", price: 250000 },
    ],
  },
  "polish": {
    id: "polish",
    name: "Đánh Bóng Sơn",
    description: "Đánh bóng sơn xe, loại bỏ vết xước nhẹ",
    longDescription:
      "Dịch vụ đánh bóng sơn chuyên nghiệp giúp khôi phục độ bóng của lớp sơn xe, loại bỏ các vết xước nhẹ, vết oxy hóa và các khuyết điểm trên bề mặt sơn.",
    price: 350000,
    duration: 60,
    rating: 4.7,
    reviewCount: 678,
    icon: Car,
    color: "#6366f1",
    bgColor: "#e0e7ff",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop",
    ],
    steps: [
      { title: "Rửa và làm khô", description: "Rửa sạch xe và làm khô hoàn toàn" },
      { title: "Đánh clay bar", description: "Xử lý bề mặt sơn với clay bar" },
      { title: "Đánh bóng cắt", description: "Sử dụng hợp chất cắt để loại bỏ vết xước" },
      { title: "Đánh bóng hoàn thiện", description: "Đánh bóng để đạt độ bóng cao nhất" },
      { title: "Kiểm tra và bàn giao", description: "Kiểm tra kỹ lưỡng và bàn giao xe" },
    ],
    includes: [
      "Rửa xe sạch",
      "Clay bar xử lý",
      "Đánh bóng cắt",
      "Đánh bóng hoàn thiện",
      "Phủ sáp bảo vệ",
    ],
    addons: [
      { id: "addon-compound", name: "Đánh bóng nặng", price: 200000 },
      { id: "addon-swirl", name: "Loại bỏ swirl marks", price: 150000 },
    ],
  },
  "maintenance": {
    id: "maintenance",
    name: "Bảo Dưỡng Xe",
    description: "Kiểm tra, thay nhớt, phanh, lốp",
    longDescription:
      "Dịch vụ bảo dưỡng toàn diện giúp xe luôn trong tình trạng tốt nhất. Kiểm tra và bảo dưỡng các hệ thống quan trọng như động cơ, phanh, lốp và nhiều hơn nữa.",
    price: 500000,
    duration: 120,
    rating: 4.9,
    reviewCount: 934,
    icon: Wrench,
    color: "#ef4444",
    bgColor: "#fee2e2",
    images: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800&h=600&fit=crop",
    ],
    steps: [
      { title: "Kiểm tra tổng quát", description: "Quét toàn bộ xe để phát hiện vấn đề" },
      { title: "Kiểm tra nhớt", description: "Kiểm tra mức và chất lượng dầu nhớt" },
      { title: "Kiểm tra phanh", description: "Kiểm tra độ dày má phanh và bộ phận phanh" },
      { title: "Kiểm tra lốp", description: "Kiểm tra áp suất và độ mòn của lốp" },
      { title: "Kiểm tra hệ thống điện", description: "Kiểm tra ắc quy và hệ thống điện" },
      { title: "Báo cáo và tư vấn", description: "Báo cáo chi tiết và tư vấn bảo dưỡng" },
    ],
    includes: [
      "Kiểm tra tổng quát 30 điểm",
      "Kiểm tra dầu nhớt",
      "Kiểm tra phanh",
      "Kiểm tra lốp xe",
      "Kiểm tra ắc quy",
    ],
    addons: [
      { id: "addon-oil", name: "Thay dầu nhớt", price: 350000 },
      { id: "addon-brake", name: "Thay má phanh", price: 450000 },
    ],
  },
};

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}

export default function ServiceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const serviceId = params.id;

  const service = serviceId ? SERVICES_DATA[serviceId] : null;

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4 pt-3 pb-4 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Không tìm thấy</Text>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground text-center">
            Dịch vụ này không tồn tại hoặc đã bị xóa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const Icon = service.icon;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="px-4 pt-3 pb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-card items-center justify-center"
            >
              <ArrowLeft size={20} color="#1a1a1a" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Chi tiết dịch vụ</Text>
          </View>
        </View>

        {/* Hero Image */}
        <View className="px-4">
          <View className="rounded-2xl overflow-hidden h-56">
            <Image
              source={{ uri: service.images[0] }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <View className="absolute bottom-4 left-4 right-4">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: service.bgColor }}
              >
                <Icon size={32} color={service.color} strokeWidth={1.8} />
              </View>
            </View>
          </View>
        </View>

        {/* Service Info */}
        <View className="px-4 mt-5">
          <Text className="text-2xl font-bold text-foreground">{service.name}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {service.description}
          </Text>

          {/* Rating & Duration */}
          <View className="flex-row items-center gap-4 mt-3">
            <View className="flex-row items-center gap-1.5">
              <Star
                size={16}
                color="#f59e0b"
                strokeWidth={2}
                fill="#f59e0b"
              />
              <Text className="text-sm font-semibold text-foreground">
                {service.rating}
              </Text>
              <Text className="text-sm text-muted-foreground">
                ({service.reviewCount.toLocaleString("vi-VN")} đánh giá)
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color="#7a8599" strokeWidth={2} />
              <Text className="text-sm text-muted-foreground">
                {service.duration} phút
              </Text>
            </View>
          </View>

          {/* Price */}
          <View className="mt-4 p-4 bg-card rounded-xl border border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-muted-foreground">Giá dịch vụ</Text>
                <Text className="text-2xl font-bold text-primary">
                  {formatCurrency(service.price)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/booking",
                    params: { servicePackageId: serviceId },
                  })
                }
                className="bg-primary px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-bold">Đặt lịch ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mô tả */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-5 rounded-full bg-primary" />
            <Text className="font-bold text-lg text-foreground">Giới thiệu dịch vụ</Text>
          </View>
          <Text className="text-sm text-foreground leading-relaxed">
            {service.longDescription}
          </Text>
        </View>

        {/* Quy trình thực hiện */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <Text className="font-bold text-lg text-foreground">Quy trình thông minh</Text>
          </View>
          <View className="gap-3">
            {service.steps.map((step, index) => (
              <View
                key={index}
                className="flex-row gap-3"
              >
                <View className="items-center">
                  <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-sm font-bold text-emerald-600">
                      {index + 1}
                    </Text>
                  </View>
                  {index < service.steps.length - 1 && (
                    <View className="w-0.5 flex-1 bg-emerald-200 mt-1 mb-1" />
                  )}
                </View>
                <View className="flex-1 pb-4">
                  <Text className="font-semibold text-foreground">{step.title}</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bao gồm */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-5 rounded-full bg-blue-500" />
            <Text className="font-bold text-lg text-foreground">Dịch vụ bao gồm</Text>
          </View>
          <View className="bg-card rounded-xl border border-border p-4">
            {service.includes.map((item, index) => (
              <View key={index} className="flex-row items-center gap-2 mb-2">
                <CheckCircle2 size={16} color="#10b981" strokeWidth={2.5} />
                <Text className="text-sm text-foreground flex-1">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dịch vụ đi kèm */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-5 rounded-full bg-amber-500" />
            <Text className="font-bold text-lg text-foreground">Dịch vụ đi kèm</Text>
          </View>
          <View className="gap-2">
            {service.addons.map((addon) => (
              <TouchableOpacity
                key={addon.id}
                className="flex-row items-center justify-between bg-card rounded-xl border border-border p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-secondary items-center justify-center">
                    <Icon size={20} color="#1a5fd4" strokeWidth={2} />
                  </View>
                  <Text className="font-semibold text-foreground">{addon.name}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-bold text-primary">
                    +{formatCurrency(addon.price)}
                  </Text>
                  <ChevronRight size={16} color="#7a8599" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Images Gallery */}
        <View className="px-4 mt-6 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1.5 h-5 rounded-full bg-purple-500" />
            <Text className="font-bold text-lg text-foreground">Hình ảnh dịch vụ</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {service.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                className="w-64 h-44 rounded-xl"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute left-0 right-0 bottom-0 px-4 py-4 bg-background border-t border-border">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/booking",
              params: { servicePackageId: serviceId },
            })
          }
          activeOpacity={0.85}
          className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2"
          style={{
            shadowColor: "#1a5fd4",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.28,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text className="text-white font-bold text-lg">
            Đặt lịch ngay
          </Text>
          <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
