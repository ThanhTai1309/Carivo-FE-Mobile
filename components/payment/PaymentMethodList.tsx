import { View, Text, TouchableOpacity } from "react-native";
import { CreditCard, Landmark } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

interface PaymentMethod {
  id: "payos" | "cash";
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badge?: string;
}

const METHODS: PaymentMethod[] = [
  {
    id: "payos",
    icon: CreditCard,
    title: "PayOS Online",
    subtitle: "QR ngân hàng, thẻ Visa/Master/JCB",
    badge: "Khuyến nghị",
  },
  {
    id: "cash",
    icon: Landmark,
    title: "Tiền mặt tại garage",
    subtitle: "Thanh toán trực tiếp sau khi rửa xe xong",
  },
];

interface PaymentMethodListProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function PaymentMethodList({
  selectedId,
  onSelect,
}: PaymentMethodListProps) {
  return (
    <View className="px-4 mt-4 mb-4">
      <Text className="text-xs font-bold text-muted-foreground tracking-wide mb-2">
        PHƯƠNG THỨC THANH TOÁN
      </Text>

      <View className="bg-card rounded-xl overflow-hidden border border-border">
        {METHODS.map((method, index) => {
          const Icon = method.icon;
          const selected = method.id === selectedId;

          return (
            <View key={method.id}>
              {index > 0 && (
                <View
                  className="border-t border-border"
                  style={{ marginHorizontal: 16 }}
                />
              )}
              <TouchableOpacity
                onPress={() => onSelect(method.id)}
                className={`flex-row items-center gap-3 px-4 py-3 ${
                  selected ? "bg-secondary" : ""
                }`}
              >
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 ${
                    selected ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Icon
                    size={20}
                    color={selected ? "#ffffff" : "#8a96a8"}
                    strokeWidth={2.4}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-foreground">
                      {method.title}
                    </Text>
                    {method.badge ? (
                      <View className="rounded-full bg-primary/15 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-primary tracking-wide">
                          {method.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {method.subtitle}
                  </Text>
                </View>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    selected ? "border-primary" : "border-muted-foreground"
                  }`}
                >
                  {selected && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
