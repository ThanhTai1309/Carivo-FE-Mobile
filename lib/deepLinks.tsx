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
  BOOKING_VIOLATION_WARNING: "BOOKING_VIOLATION",
  BOOKING_DEPOSIT_REQUIRED: "BOOKING_VIOLATION",
  BOOKING_BLOCKED: "BOOKING_VIOLATION",
  BOOKING_VIOLATION_APPEAL_RESOLVED: "BOOKING_VIOLATION",
  BOOKING_VIOLATION: "BOOKING_VIOLATION",
  BOOKING_VIOLATION_APPEAL: "BOOKING_VIOLATION",
  REVIEW: "REVIEW",
  REVIEW_REQUEST: "REVIEW",
  REVIEW_REPLIED: "REVIEW",
  REVIEW_HIDDEN: "REVIEW",
  REVIEW_PUBLISHED: "REVIEW",
  SURVEY: "SURVEY",
  SURVEY_REQUEST: "SURVEY",
  FEEDBACK_REMINDER: "BOOKING",
  FEEDBACK_REWARD_EARNED: "LOYALTY",
  CASE: "CUSTOMER_CASE",
  CUSTOMER_CASE: "CUSTOMER_CASE",
  VEHICLE: "VEHICLE",
  PROMOTION: "PROMOTION",
  CUSTOMER_VOUCHER: "VOUCHER",
  CUSTOMER_VOUCHER_ISSUED: "VOUCHER",
  COMPENSATION_VOUCHER_ISSUED: "VOUCHER",
  LOYALTY: "LOYALTY",
};

function resolveBucket(
  rawType: string | undefined,
  relatedType: string | undefined
): string | null {
  const candidates = [rawType, relatedType].filter(Boolean) as string[];
  for (const value of candidates) {
    const upper = value.toUpperCase();
    if (TYPE_ALIASES[upper]) return TYPE_ALIASES[upper];
    if (upper.includes("WAITLIST")) return "WAITLIST";
    if (upper.includes("CASE")) return "CUSTOMER_CASE";
    if (upper.includes("BOOKING")) return "BOOKING";
    if (upper.includes("REVIEW")) return "REVIEW";
    if (upper.includes("SURVEY")) return "SURVEY";
    if (upper.includes("FEEDBACK_REWARD")) return "LOYALTY";
    if (upper.includes("FEEDBACK")) return "BOOKING";
    if (upper.includes("LOYALTY")) return "LOYALTY";
    if (upper.includes("PROMOTION")) return "PROMOTION";
    if (upper.includes("VOUCHER")) return "VOUCHER";
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

    case "BOOKING_VIOLATION":
      return { pathname: "/booking-reliability" };

    case "REVIEW": {
      const metadata =
        data.metadata && typeof data.metadata === "object"
          ? (data.metadata as Record<string, unknown>)
          : null;
      const metadataBookingId =
        typeof metadata?.booking_id === "string"
          ? metadata.booking_id
          : undefined;
      const bookingId =
        metadataBookingId ||
        (typeof data.booking_id === "string" ? data.booking_id : undefined) ||
        (data.type === "REVIEW_REQUEST" ? id : undefined);
      return bookingId
        ? {
            pathname: "/review/[bookingId]",
            params: { bookingId },
          }
        : { pathname: "/reviews" };
    }

    case "SURVEY": {
      const metadata =
        data.metadata && typeof data.metadata === "object"
          ? (data.metadata as Record<string, unknown>)
          : null;
      const bookingId =
        typeof metadata?.booking_id === "string"
          ? metadata.booking_id
          : typeof data.booking_id === "string"
            ? data.booking_id
            : undefined;
      const surveyId =
        typeof metadata?.survey_id === "string"
          ? metadata.survey_id
          : id;
      if (!bookingId) return null;
      return {
        pathname: "/survey-response",
        params: {
          bookingId,
          ...(surveyId ? { surveyId } : {}),
        },
      };
    }

    case "LOYALTY":
      return { pathname: "/(tabs)/profile" };

    case "PROMOTION":
      return { pathname: "/(tabs)" };

    case "VOUCHER":
      return { pathname: "/vouchers" };

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
