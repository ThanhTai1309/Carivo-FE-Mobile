import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";

export type LoadingButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "ghost";

interface LoadingButtonProps
  extends Omit<TouchableOpacityProps, "children" | "style"> {
  title: string;
  loading?: boolean;
  loadingTitle?: string;
  variant?: LoadingButtonVariant;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<
  LoadingButtonVariant,
  { bg: string; text: string; border?: string; iconColor: string }
> = {
  primary: { bg: "bg-primary", text: "text-white", iconColor: "#ffffff" },
  secondary: {
    bg: "bg-card",
    text: "text-primary",
    border: "border border-border",
    iconColor: "#1a5fd4",
  },
  success: { bg: "bg-emerald-600", text: "text-white", iconColor: "#ffffff" },
  danger: { bg: "bg-red-600", text: "text-white", iconColor: "#ffffff" },
  ghost: {
    bg: "bg-transparent",
    text: "text-primary",
    iconColor: "#1a5fd4",
  },
};

const LIGHT_ICON_VARIANTS: ReadonlySet<LoadingButtonVariant> = new Set([
  "secondary",
  "ghost",
]);

export default function LoadingButton({
  title,
  loading = false,
  loadingTitle,
  variant = "primary",
  icon: Icon,
  iconPosition = "left",
  fullWidth = true,
  disabled,
  className = "",
  ...rest
}: LoadingButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;
  const displayTitle = loading && loadingTitle ? loadingTitle : title;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      className={[
        fullWidth ? "w-full" : "",
        variantStyle.bg,
        variantStyle.text,
        variantStyle.border ?? "",
        isDisabled ? "opacity-70" : "",
        "rounded-xl py-4 px-5 flex-row items-center justify-center gap-2",
        className,
      ].join(" ")}
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!isDisabled,
        busy: !!loading,
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            LIGHT_ICON_VARIANTS.has(variant)
              ? VARIANT_STYLES[variant].iconColor
              : "#ffffff"
          }
        />
      ) : Icon && iconPosition === "left" ? (
        <Icon size={18} color={variantStyle.iconColor} strokeWidth={2.4} />
      ) : null}
      <Text className={`${variantStyle.text} font-bold text-base`}>
        {displayTitle}
      </Text>
      {Icon && iconPosition === "right" && !loading ? (
        <Icon size={18} color={variantStyle.iconColor} strokeWidth={2.4} />
      ) : null}
    </TouchableOpacity>
  );
}
