import { View } from "react-native";
import { Clock, Star } from "lucide-react-native";
import StatCard from "./home/StatCard";

interface StatsRowProps {
  waitMinutes?: number;
  loyaltyPoints?: string;
  waitLabel?: string;
  pointsLabel?: string;
}

export default function StatsRow({
  waitMinutes = 0,
  loyaltyPoints = "0",
  waitLabel = "Phút chờ ước tính",
  pointsLabel = "Điểm tích lũy",
}: StatsRowProps) {
  return (
    <View className="px-4 mt-4 flex-row gap-3">
      <StatCard
        icon={Clock}
        value={waitMinutes}
        label={waitLabel}
        tone="primary"
      />
      <StatCard
        icon={Star}
        value={loyaltyPoints}
        label={pointsLabel}
        tone="dark"
      />
    </View>
  );
}
