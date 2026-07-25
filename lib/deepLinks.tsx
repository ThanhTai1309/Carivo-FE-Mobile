import { router } from "expo-router";
import type { PushNotificationData } from "@/lib/pushNotifications";

export interface DeepLinkTarget {
  pathname: string;
  params?: Record<string, string>;
}

const TYPE_ALIASES: Record<string, string> = {
  WAITLIST: "WAITLIST",
  WAITLIST_JOINED: "WAITLIST",
  WAITLIST_OFFERED: "WAITLIST",
  WAITLIST_OFFER_ACCEPTED: "WAITLIST",
  WAITLIST_OFFER_EXPIRED: "WAITLIST",
  WAITLIST_EXPIRED: "WAITLIST",
  WAITLIST_CANCELED: "WAITLIST",
  BOOKING: "BOOKING",
  BOOKING_CONFIRMED: "BOOKING",
  BOOKING_REMINDER: "BOOKING",
  BOOKING_CANCELED: "BOOKING",
  BOOKING_INCIDENT_REPORTED: "BOOKING",
  BOOKING_INCIDENT_RESOLVED: "BOOKING",
  BOOKING_CUSTOMER_DECISION_REQUIRED: "BOOKING",
  CASE: "CUSTOMER_CASE",
  CUSTOMER_CASE: "CUSTOMER_CASE",
  VEHICLE: "VEHICLE",
  PROMOTION: "PROMOTION",
  LOYALTY: "LOYALTY",
};

function resolveBucket(
  rawType: string | undefined,
  relatedType: string | undefined
): string | null {
  const candidates = [relatedType, rawType].filter(Boolean) as string[];
  for (const value of candidates) {
    const upper = value.toUpperCase();
    if (TYPE_ALIASES[upper]) return TYPE_ALIASES[upper];
    if (upper.includes("WAITLIST")) return "WAITLIST";
    if (upper.includes("CASE")) return "CUSTOMER_CASE";
    if (upper.includes("BOOKING")) return "BOOKING";
    if (upper.includes("LOYALTY")) return "LOYALTY";
    if (upper.includes("PROMOTION")) return "PROMOTION";
    if (upper.includes("VEHICLE")) return "VEHICLE";
  }
  return null;
}

export function resolveDeepLink(data: PushNotificationData): DeepLinkTarget | null {
  if (data.url && typeof data.url === "string") {
    return null; // expo-router will handle URL via the scheme if it parses
  }

  const bucket = resolveBucket(
    typeof data.type === "string" ? data.type : undefined,
    data.related_type
  );
  const id = data.related_id;

  if (!bucket) return null;

  switch (bucket) {
    case "WAITLIST":
      if (!id) return null;
      return { pathname: "/waitlist/[id]", params: { id } };

    case "CUSTOMER_CASE":
      if (!id) return null;
      return { pathname: "/support/cases/[id]", params: { id } };

    case "BOOKING":
      if (!id) return null;
      return { pathname: "/booking-detail", params: { id } };

    case "LOYALTY":
      return { pathname: "/(tabs)/profile" };

    case "PROMOTION":
      return { pathname: "/(tabs)" };

    case "VEHICLE":
      return { pathname: "/my-vehicles" };

    default:
      return null;
  }
}

export function handleNotificationDeepLink(data: PushNotificationData) {
  if (data.url && typeof data.url === "string") {
    router.push(data.url as never);
    return;
  }

  const target = resolveDeepLink(data);
  if (target) {
    router.push(target as never);
  } else {
    router.push("/notifications" as never);
  }
}
