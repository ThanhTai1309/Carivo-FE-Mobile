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
  Calendar,
  Eye,
  Lightbulb,
  Trophy,
  Gift,
  PartyPopper,
  Megaphone,
  BookOpen,
  Clock,
  ChevronRight,
} from "lucide-react-native";

type NewsCategory = "tips" | "membership" | "event" | "promotion" | "contest" | "blog";

interface NewsDetail {
  id: string;
  title: string;
  description: string;
  content: string;
  category: NewsCategory;
  categoryLabel: string;
  date: string;
  author: string;
  readTime: number;
  viewCount: number;
  imageUrl: string;
  images: string[];
  icon: string;
  accentColor: string;
  relatedNews: { id: string; title: string; imageUrl: string }[];
}

const NEWS_DATA: Record<string, NewsDetail> = {
  "tips-1": {
    id: "tips-1",
    title: "5 Mẹo Bảo Vệ Sơn Xe Mùa Mưa",
    description: "Những cách đơn giản giúp sơn xe bền đẹp quanh năm, đặc biệt trong mùa mưa bão.",
    content: `Mùa mưa là thời điểm xe của bạn phải đối mặt với nhiều thử thách nhất. Nước mưa mang theo axit và các chất ăn mòn có thể làm hỏng lớp sơn bảo vệ của xe. Dưới đây là 5 mẹo giúp bạn bảo vệ sơn xe hiệu quả:

**1. Rửa xe ngay sau khi trời mưa**
Sau khi xe bị ngâm trong nước mưa, hãy rửa xe ngay lập tức để loại bỏ các chất axit và bụi bẩn bám trên bề mặt sơn.

**2. Phủ Ceramic hoặc sáp bảo vệ**
Việc phủ Ceramic hoặc sáp bảo vệ sẽ tạo một lớp màng chắn giữa sơn xe và các tác nhân bên ngoài, giúp bảo vệ sơn tốt hơn.

**3. Đỗ xe trong bãi đỗ hoặc garage**
Hạn chế đỗ xe ngoài trời mưa, đặc biệt là dưới cây cối vì nhựa cây và phân chim cũng có thể làm hỏng sơn.

**4. Lau khô xe sau khi rửa**
Sau khi rửa xe, hãy lau khô hoàn toàn bằng khăn microfiber chuyên dụng để tránh vết nước và vết bẩn.

**5. Đánh bóng định kỳ**
Việc đánh bóng xe định kỳ (3-6 tháng/lần) sẽ giúp loại bỏ các vết oxy hóa nhẹ và duy trì độ bóng của lớp sơn.`,
    category: "tips",
    categoryLabel: "Mẹo hay",
    date: "28/07/2026",
    author: "Carivo Team",
    readTime: 5,
    viewCount: 1234,
    imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
    ],
    icon: "Lightbulb",
    accentColor: "#f59e0b",
    relatedNews: [
      { id: "tips-2", title: "Cách vệ sinh nội thất xe đúng cách", imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=300&h=200&fit=crop" },
      { id: "membership-1", title: "Nâng Hạng Vàng - Nhận Ưu Đãi 30%", imageUrl: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=300&h=200&fit=crop" },
    ],
  },
  "membership-1": {
    id: "membership-1",
    title: "Nâng Hạng Vàng - Nhận Ưu Đãi 30%",
    description: "Tích điểm để thăng hạng thành viên và nhận ngay ưu đãi giảm giá 30% cho mọi dịch vụ.",
    content: `Chương trình Thành viên Carivo mang đến nhiều quyền lợi hấp dẫn cho khách hàng thân thiết. Hãy cùng tìm hiểu cách nâng hạng và nhận ưu đãi!

**Hệ thống hạng thành viên Carivo:**

- **Đồng (Bronze):** Hạng khởi đầu cho mọi khách hàng
- **Bạc (Silver):** Tích lũy nhanh hơn, ưu tiên đặt lịch
- **Vàng (Gold):** Hệ số điểm tốt hơn, ưu đãi 20%
- **Bạch kim (Platinum):** Đặc quyền đối tác ưu tiên, ưu đãi 30%

**Cách tích điểm:**
Mỗi 1.000đ thanh toán = 1 điểm tích lũy (tùy hạng thành viên có hệ số khác nhau).

**Cách thăng hạng:**
- Lên Bạc: 500 điểm
- Lên Vàng: 2.000 điểm
- Lên Bạch kim: 5.000 điểm

**Quyền lợi khi đạt hạng Vàng:**
- Giảm giá 20% cho mọi dịch vụ
- Ưu tiên đặt lịch
- Được nhận voucher sinh nhật
- Hệ số tích điểm x1.5`,
    category: "membership",
    categoryLabel: "Thành viên",
    date: "27/07/2026",
    author: "Carivo Team",
    readTime: 4,
    viewCount: 2345,
    imageUrl: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
    icon: "Trophy",
    accentColor: "#eab308",
    relatedNews: [
      { id: "tips-1", title: "5 Mẹo Bảo Vệ Sơn Xe Mùa Mưa", imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=300&h=200&fit=crop" },
      { id: "event-1", title: "Rửa 5 Lần - Nhận Voucher 50K", imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=300&h=200&fit=crop" },
    ],
  },
  "event-1": {
    id: "event-1",
    title: "Rửa 5 Lần - Nhận Voucher 50K",
    description: "Đặt lịch và rửa xe 5 lần trong tháng, nhận ngay voucher giảm 50.000đ cho lần tiếp theo.",
    content: `🎉 **CHƯƠNG TRÌNH ĐẶC BIỆT THÁNG NÀY**

**Thể lệ:**
- Đặt lịch và hoàn thành 5 lần rửa xe bất kỳ trong tháng
- Áp dụng cho cả dịch vụ đơn lẻ và combo
- Không giới hạn giá trị đơn hàng
- Voucher có giá trị 50.000đ cho lần sử dụng tiếp theo

**Thời gian:** 01/07/2026 - 31/07/2026

**Cách tham gia:**
1. Đặt lịch rửa xe qua app Carivo
2. Hoàn thành dịch vụ và thanh toán
3. Sau lần rửa thứ 5, voucher sẽ tự động được cộng vào tài khoản
4. Sử dụng voucher ở lần đặt tiếp theo

**Lưu ý:**
- Chỉ tính các lượt rửa xe đã hoàn thành và thanh toán
- Voucher có hiệu lực trong 30 ngày kể từ ngày nhận
- Không áp dụng đồng thời với các chương trình khuyến mãi khác`,
    category: "event",
    categoryLabel: "Sự kiện",
    date: "26/07/2026",
    author: "Carivo Team",
    readTime: 3,
    viewCount: 3456,
    imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    ],
    icon: "Gift",
    accentColor: "#ec4899",
    relatedNews: [
      { id: "contest-1", title: "Bốc Thăm May Mắn - Trúng Tour Mùa Hè", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&h=200&fit=crop" },
      { id: "promotion-1", title: "Tuần Này: Giảm 20% Ceramic Nano", imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=300&h=200&fit=crop" },
    ],
  },
  "contest-1": {
    id: "contest-1",
    title: "Bốc Thăm May Mắn - Trúng Tour Mùa Hè",
    description: "Hoàn thành 10 lượt rửa xe trong quý, tham gia bốc thăm trúng tour du lịch mùa hè 1 tuần.",
    content: `🏆 **CHƯƠNG TRÌNH BỐC THĂM TRÚNG THƯỞNG**

**Giải thưởng hấp dẫn:**
- 🥇 Giải đặc biệt: Tour du lịch mùa hè 1 tuần trị giá 15.000.000đ
- 🥈 3 Giải nhì: Voucher Carivo trị giá 2.000.000đ
- 🥉 10 Giải ba: Voucher Carivo trị giá 500.000đ

**Thời gian:** Quý 3/2026 (01/07/2026 - 30/09/2026)

**Điều kiện tham gia:**
- Hoàn thành 10 lượt rửa xe bất kỳ trong quý
- Mỗi lượt rửa xe = 1 vé bốc thăm
- Càng nhiều lượt rửa = Càng nhiều vé

**Cách theo dõi:**
- Theo dõi số lượt rửa xe trong mục "Hoạt động của bạn"
- Vé bốc thăm được cộng tự động sau mỗi lượt rửa hoàn thành

**Thông báo kết quả:** 15/10/2026

Đừng bỏ lỡ cơ hội trúng tour mùa hè!`,
    category: "contest",
    categoryLabel: "Bốc thăm",
    date: "25/07/2026",
    author: "Carivo Team",
    readTime: 4,
    viewCount: 4567,
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
    ],
    icon: "PartyPopper",
    accentColor: "#8b5cf6",
    relatedNews: [
      { id: "event-1", title: "Rửa 5 Lần - Nhận Voucher 50K", imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=300&h=200&fit=crop" },
      { id: "blog-1", title: "Trải Nghiệm Rửa Xe Carivo", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop" },
    ],
  },
  "promotion-1": {
    id: "promotion-1",
    title: "Tuần Này: Giảm 20% Ceramic Nano",
    description: "Chỉ áp dụng tuần này! Đặt lịch phủ Ceramic Nano, giảm ngay 20% chi phí.",
    content: `🔥 **KHUYẾN MÃI CÓ HẠN**

**Nội dung ưu đãi:**
- Giảm 20% chi phí phủ Ceramic Nano
- Áp dụng cho tất cả các loại xe
- Không giới hạn số lượng

**Thời gian:** 22/07/2026 - 31/07/2026

**Điều kiện:**
- Đặt lịch trước và hoàn thành trong tuần khuyến mãi
- Áp dụng cho dịch vụ Phủ Ceramic Nano (không áp dụng cho combo)
- Không kết hợp với các mã khuyến mãi khác

**Lợi ích của Ceramic Nano:**
- Bảo vệ sơn xe khỏi trầy xước
- Chống tia UV, ngăn sơn phai màu
- Giữ xe bóng đẹp trong thời gian dài
- Dễ lau chùi, bụi bẩn không bám chặt

**Đặt lịch ngay:** Liên hệ qua app Carivo hoặc hotline để được tư vấn và đặt lịch.`,
    category: "promotion",
    categoryLabel: "Khuyến mãi",
    date: "24/07/2026",
    author: "Carivo Team",
    readTime: 3,
    viewCount: 5678,
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop",
    ],
    icon: "Megaphone",
    accentColor: "#ef4444",
    relatedNews: [
      { id: "event-1", title: "Rửa 5 Lần - Nhận Voucher 50K", imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=300&h=200&fit=crop" },
      { id: "membership-1", title: "Nâng Hạng Vàng - Nhận Ưu Đãi 30%", imageUrl: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=300&h=200&fit=crop" },
    ],
  },
  "tips-2": {
    id: "tips-2",
    title: "Cách vệ Sinh Nội Thất Xe Đúng Cách",
    description: "Hướng dẫn chi tiết cách vệ sinh nội thất xe từ ghế da, vải cho đến bảng điều khiển và trần xe.",
    content: `Nội thất xe là nơi bạn tiếp xúc trực tiếp hàng ngày, vì vậy việc vệ sinh đúng cách không chỉ giúp xe sạch sẽ mà còn bảo vệ sức khỏe của bạn và gia đình. Dưới đây là hướng dẫn chi tiết từng bước:

**1. Chuẩn bị dụng cụ**
- Máy hút bụi cầm tay hoặc máy hút bụi ô tô chuyên dụng
- Khăn microfiber (ít nhất 3-4 chiếc)
- Dung dịch vệ sinh nội thất chuyên dụng
- Bàn chải mềm, bàn chải cứng
- Nước sạch, xô đựng
- Găng tay cao su

**2. Vệ sinh ghế da**
- Bước 1: Hút bụi toàn bộ bề mặt ghế, kể cả khe rãnh
- Bước 2: Lau sơ bằng khăn ẩm để loại bỏ bụi bẩn bám ngoài
- Bước 3: Xịt dung dịch vệ sinh da lên khăn microfiber (không xịt trực tiếp lên ghế)
- Bước 4: Lau đều theo hình tròn, nhẹ nhàng
- Bước 5: Lau lại bằng khăn khô sạch
- Bước 6: Bôi kem dưỡng da chuyên dụng để giữ độ mềm mại và bóng đẹp

**3. Vệ sinh ghế vải**
- Hút bụi kỹ càng, đặc biệt các khe và đường chỉ
- Xịt dung dịch đánh bay vết bẩn lên vết ố trước
- Dùng bàn chải mềm chà nhẹ theo một chiều
- Lau sạch bằng khăn ẩm, để khô tự nhiên

**4. Vệ sinh bảng điều khiển**
- Lau bằng khăn microfiber khô để loại bỏ bụi
- Dùng dung dịch vệ sinh nhựa/da nội thất chuyên dụng
- Lau các nút bấm, khe thông gió bằng bàn chải nhỏ
- Chú ý không để nước rơi vào các nút bấm điện tử

**5. Vệ sinh trần xe**
- Dùng khăn microfiber ẩm lau nhẹ từ trước ra sau
- Tránh chà mạnh vì có thể làm bong lớp bọc trần
- Lau khô bằng khăn sạch

**6. Vệ sinh sàn xe**
- Lấy hết thảm ra ngoài và giũ sạch bụi
- Hút bụi toàn bộ sàn, bao gồm cả dưới ghế
- Lau sàn bằng dung dịch vệ sinh chuyên dụng
- Phơi thảm ngoài nắng để diệt khuẩn

**7. Khử mùi và tạo hương thơm**
- Đặt túi thơm hoặc dùng xịt khử mùi ô tô chuyên dụng
- Có thể dùng tinh dầu tự nhiên (chanh, bạc hà, oải hương)

**Lưu ý quan trọng:**
- Không dùng các chất tẩy rửa mạnh như thuốc tẩy, acetone
- Tránh để nước thấm vào các thiết bị điện tử
- Vệ sinh nội thất định kỳ 1-2 tháng/lần để duy trì sự sạch sẽ
- Nên đỗ xe nơi thoáng mát khi vệ sinh để mùi hóa chất bay đi nhanh hơn

Với những bước đơn giản trên, bạn có thể tự vệ sinh nội thất xe tại nhà, tiết kiệm chi phí mà vẫn đảm bảo xe luôn sạch đẹp và an toàn cho sức khỏe.`,
    category: "tips",
    categoryLabel: "Mẹo hay",
    date: "22/07/2026",
    author: "Carivo Team",
    readTime: 7,
    viewCount: 1890,
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    ],
    icon: "Lightbulb",
    accentColor: "#f59e0b",
    relatedNews: [
      { id: "tips-1", title: "5 Mẹo Bảo Vệ Sơn Xe Mùa Mưa", imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=300&h=200&fit=crop" },
      { id: "promotion-1", title: "Tuần Này: Giảm 20% Ceramic Nano", imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=300&h=200&fit=crop" },
    ],
  },
  "blog-1": {
    id: "blog-1",
    title: "Trải Nghiệm Rửa Xe Carivo - Có Gì Đặc Biệt?",
    description: "Chia sẻ thực tế từ khách hàng về trải nghiệm dịch vụ tại Carivo Garage.",
    content: `📝 **CHIA SẺ TỪ KHÁCH HÀNG**

**Trải nghiệm của chị Lan - khách hàng 2 năm:**

"Trước đây, tôi luôn e ngại việc rửa xe vì phải chờ đợi rất lâu và chất lượng không đồng đều. Từ khi biết đến Carivo qua lời giới thiệu của đồng nghiệp, tôi đã trở thành khách quen tại đây.

Điều tôi ấn tượng nhất là:
- **Đặt lịch online rất tiện lợi:** Chỉ cần vài thao tác trên app là đã có lịch, không cần gọi điện.
- **Nhân viên chuyên nghiệp:** Ai cũng nhiệt tình, tư vấn kỹ về dịch vụ phù hợp với xe tôi.
- **Chất lượng đồng đều:** Dù đi vào dịp cuối tuần hay ngày thường, chất lượng rửa xe đều rất tốt.
- **Thông báo minh bạch:** Tôi luôn được thông báo về trạng thái xe qua app.

Đặc biệt, tôi rất thích combo Gia Đình vì bao gồm đầy đủ các dịch vụ mà tôi cần. Tiết kiệm được thời gian và chi phí hơn nhiều so với đặt lẻ."

*Carivo xin cảm ơn chị Lan đã chia sẻ!*`,
    category: "blog",
    categoryLabel: "Chia sẻ",
    date: "23/07/2026",
    author: "Khách hàng",
    readTime: 6,
    viewCount: 890,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop",
    ],
    icon: "BookOpen",
    accentColor: "#10b981",
    relatedNews: [
      { id: "tips-1", title: "5 Mẹo Bảo Vệ Sơn Xe Mùa Mưa", imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=300&h=200&fit=crop" },
      { id: "membership-1", title: "Nâng Hạng Vàng - Nhận Ưu Đãi 30%", imageUrl: "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=300&h=200&fit=crop" },
    ],
  },
};

function getIcon(iconName: string, color: string) {
  switch (iconName) {
    case "Lightbulb":
      return Lightbulb;
    case "Trophy":
      return Trophy;
    case "Gift":
      return Gift;
    case "PartyPopper":
      return PartyPopper;
    case "Megaphone":
      return Megaphone;
    case "BookOpen":
      return BookOpen;
    default:
      return Lightbulb;
  }
}

export default function NewsDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; title?: string }>();
  const newsId = params.id;

  const news = newsId ? NEWS_DATA[newsId] : null;

  if (!news) {
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
            Bài viết này không tồn tại hoặc đã bị xóa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const IconComponent = getIcon(news.icon, news.accentColor);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
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
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-card items-center justify-center">
            <Text className="text-lg">↗</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        <View className="px-4">
          <View className="rounded-2xl overflow-hidden h-56">
            <Image
              source={{ uri: news.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Category badge */}
            <View
              className="absolute top-3 left-3 px-3 py-1.5 rounded-full flex-row items-center gap-2"
              style={{ backgroundColor: news.accentColor }}
            >
              <IconComponent size={14} color="#ffffff" strokeWidth={2.5} />
              <Text className="text-white text-xs font-bold">{news.categoryLabel}</Text>
            </View>
          </View>
        </View>

        {/* Title & Meta */}
        <View className="px-4 mt-5">
          <Text className="text-2xl font-bold text-foreground leading-tight">
            {news.title}
          </Text>
          <Text className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {news.description}
          </Text>

          {/* Meta info */}
          <View className="flex-row items-center gap-4 mt-4">
            <View className="flex-row items-center gap-1.5">
              <Calendar size={14} color="#7a8599" strokeWidth={2} />
              <Text className="text-xs text-muted-foreground">{news.date}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color="#7a8599" strokeWidth={2} />
              <Text className="text-xs text-muted-foreground">{news.readTime} phút đọc</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Eye size={14} color="#7a8599" strokeWidth={2} />
              <Text className="text-xs text-muted-foreground">{news.viewCount.toLocaleString("vi-VN")} lượt xem</Text>
            </View>
          </View>

          {/* Author */}
          <View className="mt-4 flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {news.author.charAt(0)}
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground">Bài viết bởi {news.author}</Text>
          </View>
        </View>

        {/* Divider */}
        <View className="mx-4 mt-5 h-px bg-border" />

        {/* Content */}
        <View className="px-4 mt-5">
          <Text className="text-sm text-foreground leading-7 whitespace-pre-line">
            {news.content}
          </Text>
        </View>

        {/* Images Gallery */}
        {news.images.length > 1 && (
          <View className="px-4 mt-6">
            <View className="flex-row items-center gap-2 mb-3">
              <View
                className="w-1.5 h-5 rounded-full"
                style={{ backgroundColor: news.accentColor }}
              />
              <Text className="font-bold text-lg text-foreground">Hình ảnh</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12 }}
            >
              {news.images.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  className="w-72 h-48 rounded-xl"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Related News */}
        {news.relatedNews.length > 0 && (
          <View className="px-4 mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <View
                  className="w-1.5 h-5 rounded-full"
                  style={{ backgroundColor: news.accentColor }}
                />
                <Text className="font-bold text-lg text-foreground">Bài viết liên quan</Text>
              </View>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text className="text-primary text-sm font-medium">Xem tất cả</Text>
                <ChevronRight size={14} color="#1a5fd4" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <View className="gap-3">
              {news.relatedNews.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/news/[id]",
                      params: { id: item.id, title: item.title },
                    })
                  }
                  activeOpacity={0.85}
                  className="flex-row bg-card rounded-xl border border-border overflow-hidden"
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-24 h-20"
                    resizeMode="cover"
                  />
                  <View className="flex-1 p-3 justify-center">
                    <Text
                      className="text-sm font-semibold text-foreground leading-tight"
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">Đọc thêm →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Share CTA */}
        <View className="px-4 mt-8 mb-4">
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold">Chia sẻ bài viết</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
