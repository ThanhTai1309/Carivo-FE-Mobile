import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, MapPin, Sparkles, Car, Clock4 } from "lucide-react-native";

type StepState = "done" | "active" | "inactive";

interface StepIndicatorProps {
  step1: StepState;
  step2: StepState;
  step3: StepState;
  step4: StepState;
}

interface StepConfig {
  number: number;
  label: string;
  icon: typeof MapPin;
}

const STEPS: StepConfig[] = [
  { number: 1, label: "Địa điểm", icon: MapPin },
  { number: 2, label: "Phương tiện", icon: Car },
  { number: 3, label: "Dịch vụ", icon: Sparkles },
  { number: 4, label: "Thời gian", icon: Clock4 },
];

const STEP_WIDTH = 64;

function StepItem({ config, state }: { config: StepConfig; state: StepState }) {
  const { number, label, icon: Icon } = config;
  const isDone = state === "done";
  const isActive = state === "active";

  return (
    <View
      style={{ width: STEP_WIDTH }}
      className="items-center"
    >
      <View className="relative" style={{ width: 40, height: 40 }}>
        {isActive ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -4,
              left: -4,
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: "#1a5fd4",
              opacity: 0.45,
            }}
          />
        ) : null}

        <View
          className="rounded-full items-center justify-center overflow-hidden"
          style={{
            width: 40,
            height: 40,
            borderWidth: 2,
            borderColor: isDone || isActive ? "transparent" : "#e5e7eb",
          }}
        >
          {isDone ? (
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={18} color="#ffffff" strokeWidth={3} />
            </LinearGradient>
          ) : isActive ? (
            <LinearGradient
              colors={["#1a5fd4", "#0d3fa8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={17} color="#ffffff" strokeWidth={2.4} />
            </LinearGradient>
          ) : (
            <View
              className="items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#f3f4f6",
              }}
            >
              <Icon size={16} color="#9ca3af" strokeWidth={2.2} />
            </View>
          )}
        </View>

        <View
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: isDone ? "#10b981" : isActive ? "#1a5fd4" : "#cbd5e1",
            borderWidth: 2,
            borderColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 9,
              fontWeight: "800",
            }}
          >
            {number}
          </Text>
        </View>
      </View>

      <Text
        className={`text-[11px] font-bold mt-1.5 text-center ${
          isActive
            ? "text-primary"
            : isDone
              ? "text-emerald-600"
              : "text-muted-foreground"
        }`}
        numberOfLines={1}
        style={{ maxWidth: STEP_WIDTH }}
      >
        {label}
      </Text>
    </View>
  );
}

function Connector({ filled }: { filled: boolean }) {
  return (
    <View
      className="flex-1 mx-1.5"
      style={{ height: 2, top: -22, justifyContent: "center" }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#e5e7eb",
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: filled ? "100%" : 0,
          overflow: "hidden",
          borderRadius: 1,
        }}
      >
        <LinearGradient
          colors={["#10b981", "#34d399"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

export default function StepIndicator({
  step1,
  step2,
  step3,
  step4,
}: StepIndicatorProps) {
  const states: StepState[] = [step1, step2, step3, step4];

  return (
    <View className="px-4 pt-1 pb-3">
      <View className="flex-row items-center justify-between">
        {STEPS.map((config, index) => (
          <View key={config.number} className="flex-row items-center flex-1 justify-center">
            <StepItem config={config} state={states[index]} />
            {index < STEPS.length - 1 ? (
              <Connector filled={states[index] === "done"} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}