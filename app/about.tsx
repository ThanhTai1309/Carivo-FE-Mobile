import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  Heart,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
} from "lucide-react-native";

const FEATURES = [
  {
    icon: Star,
    title: "Tích điểm thưởng",
    description: "Mỗi lần rửa xe đều tích luỹ điểm để đổi quà & ưu đãi.",
  },
  {
    icon: CheckCircle2,
    title: "Đặt lịch siêu tốc",
    description: "Chọn garage, dịch vụ và khung giờ chỉ trong vài giây.",
  },
  {
    icon: Sparkles,
    title: "Đánh giá minh bạch",
    description: "Xem review thật từ khách hàng trước khi chọn garage.",
  },
];

export default function AboutScreen() {
  const router = useRouter();

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
          <Text className="text-base font-bold text-foreground">Về Carivo</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Nền tảng chăm sóc xe toàn diện
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 gap-4">
          {/* Hero */}
          <View className="rounded-3xl bg-primary p-6 items-center">
            <View className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center">
              <CarFront size={32} color="#ffffff" strokeWidth={2.2} />
            </View>
            <Text className="text-2xl font-bold text-white mt-3">Carivo</Text>
            <Text className="text-xs text-white/80 mt-1 text-center leading-relaxed">
              Ứng dụng đặt lịch rửa xe và chăm sóc xe đáng tin cậy hàng đầu Việt
              Nam.
            </Text>
          </View>

          {/* Story */}
          <View className="rounded-2xl bg-card border border-border p-5">
            <View className="flex-row items-center gap-2 mb-2">
              <Heart size={18} color="#1a5fd4" strokeWidth={2.2} />
              <Text className="text-base font-bold text-foreground">
                Câu chuyện của chúng tôi
              </Text>
            </View>
            <Text className="text-sm text-foreground leading-6">
              Carivo ra đời với sứ mệnh kết nối khách hàng với hệ thống garage
              uy tín, giúp việc chăm sóc xe trở nên dễ dàng, minh bạch và đáng
              tin cậy. Chúng tôi tin rằng mỗi chiếc xe đều xứng đáng được chăm
              sóc bởi đội ngũ chuyên nghiệp với sự tiện lợi tối đa.
            </Text>
          </View>

          {/* Features */}
          <View>
            <Text className="text-base font-bold text-foreground mb-3">
              Tính năng nổi bật
            </Text>
            <View className="gap-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <View
                    key={feature.title}
                    className="rounded-2xl bg-card border border-border p-4 flex-row gap-3 items-start"
                  >
                    <View className="w-10 h-10 rounded-lg bg-secondary items-center justify-center">
                      <Icon size={20} color="#1a5fd4" strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        {feature.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Contact */}
          <View className="rounded-2xl bg-card border border-border p-5">
            <Text className="text-base font-bold text-foreground mb-3">
              Liên hệ với chúng tôi
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
                  <Phone size={16} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Hotline
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    1900 6868
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-lg bg-secondary items-center justify-center">
                  <Mail size={16} color="#1a5fd4" strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Email
                  </Text>
                  <Text className="text-sm font-semibold text-foreground">
                    support@carivo.vn
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/support")}
                className="mt-2 bg-primary rounded-xl py-3 flex-row items-center justify-center gap-2"
              >
                <MessageCircle size={16} color="#ffffff" strokeWidth={2.4} />
                <Text className="text-white font-bold text-sm">
                  Gửi yêu cầu hỗ trợ
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-center text-[11px] text-muted-foreground mt-2">
            © 2026 Carivo. Mọi quyền được bảo lưu.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
