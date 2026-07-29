import type { NotificationItem } from "@/lib/types";

interface LocalizedPair {
  title: string;
  message: string;
}

const isVietnamese = (text: string | null | undefined): boolean => {
  if (!text) return false;
  // Detect any Vietnamese-specific diacritics
  return /[ăâđêôơưĂÂĐÊÔƠƯáàảãạằẳẵặắấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
    text
  );
};

const BOOKING: Record<string, LocalizedPair> = {
  BOOKING: {
    title: "Cập nhật lịch hẹn",
    message: "Lịch hẹn của bạn vừa có cập nhật mới.",
  },
  BOOKING_CONFIRMED: {
    title: "Lịch hẹn đã được xác nhận",
    message:
      "Garage đã xác nhận lịch hẹn của bạn. Vui lòng đến đúng giờ đã đặt.",
  },
  BOOKING_REMINDER: {
    title: "Sắp đến giờ lịch hẹn",
    message:
      "Lịch hẹn sẽ diễn ra trong ít giờ tới. Chuẩn bị đến garage nhé.",
  },
  BOOKING_CANCELED: {
    title: "Lịch hẹn đã bị hủy",
    message:
      "Lịch hẹn của bạn đã bị hủy. Bạn có thể đặt lại khung giờ khác.",
  },
  BOOKING_INCIDENT_REPORTED: {
    title: "Garage đã báo cáo sự cố",
    message:
      "Garage đã ghi nhận sự cố trong quá trình thực hiện dịch vụ.",
  },
  BOOKING_INCIDENT_RESOLVED: {
    title: "Sự cố đã được xử lý",
    message:
      "Garage đã hoàn tất xử lý sự cố cho lịch hẹn của bạn.",
  },
  BOOKING_CUSTOMER_DECISION_REQUIRED: {
    title: "Cần bạn xác nhận",
    message:
      "Lịch hẹn cần bạn xác nhận phương án để tiếp tục.",
  },
  BOOKING_HANDOVER_REQUESTED: {
    title: "Yêu cầu bàn giao xe",
    message: "Garage đã yêu cầu bàn giao xe cho bạn.",
  },
  BOOKING_PAYMENT_REQUESTED: {
    title: "Yêu cầu thanh toán",
    message: "Garage đã yêu cầu thanh toán cho lịch hẹn của bạn.",
  },
  BOOKING_PAYMENT_RECEIVED: {
    title: "Đã nhận thanh toán",
    message: "Hệ thống đã ghi nhận thanh toán của bạn.",
  },
  BOOKING_COMPLETED: {
    title: "Lịch hẹn đã hoàn tất",
    message:
      "Dịch vụ đã hoàn thành. Cảm ơn bạn đã sử dụng Carivo.",
  },
  BOOKING_RESCHEDULED: {
    title: "Lịch hẹn đã đổi giờ",
    message: "Lịch hẹn của bạn đã được đổi sang khung giờ mới.",
  },
  BOOKING_VIOLATION_WARNING: {
    title: "Cảnh báo điểm vi phạm",
    message:
      "Điểm vi phạm đặt lịch của bạn đã chạm mức cảnh báo. Mở để xem chi tiết.",
  },
  BOOKING_DEPOSIT_REQUIRED: {
    title: "Lịch tiếp theo thuộc diện đặt cọc",
    message:
      "Tài khoản của bạn đã chạm mức yêu cầu đặt cọc cho booking tiếp theo.",
  },
  BOOKING_BLOCKED: {
    title: "Tạm khóa quyền đặt lịch",
    message:
      "Tài khoản đang bị tạm khóa tạo booking mới. Mở để xem thời gian kết thúc.",
  },
  BOOKING_VIOLATION_APPEAL_RESOLVED: {
    title: "Khiếu nại điểm vi phạm đã được xử lý",
    message: "Admin đã phản hồi khiếu nại điểm vi phạm của bạn.",
  },
  FEEDBACK_REMINDER: {
    title: "Phản hồi của bạn vẫn đang chờ",
    message:
      "Hoàn thành khảo sát và đánh giá trước khi hết hạn để nhận điểm thưởng.",
  },
};

const WAITLIST: Record<string, LocalizedPair> = {
  WAITLIST: {
    title: "Cập nhật danh sách chờ",
    message: "Danh sách chờ của bạn vừa có cập nhật mới.",
  },
  WAITLIST_JOINED: {
    title: "Đã thêm vào danh sách chờ",
    message: "Bạn đã được thêm vào danh sách chờ của garage.",
  },
  WAITLIST_OFFERED: {
    title: "Có khung giờ mới cho bạn",
    message:
      "Garage vừa mở khung giờ — bạn có thể chấp nhận ngay để giữ chỗ.",
  },
  WAITLIST_OFFER_ACCEPTED: {
    title: "Đã chấp nhận khung giờ",
    message: "Bạn đã nhận khung giờ mới từ garage.",
  },
  WAITLIST_OFFER_EXPIRED: {
    title: "Ưu đãi khung giờ đã hết hạn",
    message:
      "Ưu đãi khung giờ đã hết hạn. Bạn vẫn còn trong danh sách chờ.",
  },
  WAITLIST_EXPIRED: {
    title: "Danh sách chờ đã hết hạn",
    message: "Yêu cầu danh sách chờ của bạn đã hết hạn.",
  },
  WAITLIST_CANCELED: {
    title: "Đã hủy danh sách chờ",
    message: "Bạn đã rời khỏi danh sách chờ của garage.",
  },
};

const CUSTOMER_CASE: Record<string, LocalizedPair> = {
  CASE: {
    title: "Hồ sơ hỗ trợ mới",
    message: "Bạn có một yêu cầu hỗ trợ mới. Mở để xem chi tiết.",
  },
  CUSTOMER_CASE: {
    title: "Cập nhật hồ sơ hỗ trợ",
    message: "Hồ sơ hỗ trợ của bạn vừa có cập nhật mới.",
  },
  CASE_CREATED: {
    title: "Đã tạo hồ sơ hỗ trợ",
    message: "Yêu cầu hỗ trợ của bạn đã được gửi tới đội ngũ Carivo.",
  },
  CASE_UPDATED: {
    title: "Hồ sơ hỗ trợ được cập nhật",
    message: "Đội ngũ Carivo vừa phản hồi hồ sơ hỗ trợ của bạn.",
  },
  CASE_RESOLVED: {
    title: "Hồ sơ hỗ trợ đã đóng",
    message: "Hồ sơ hỗ trợ của bạn đã được xử lý xong.",
  },
};

const VEHICLE: Record<string, LocalizedPair> = {
  VEHICLE: {
    title: "Cập nhật về xe của bạn",
    message: "Garage vừa cập nhật thông tin cho xe của bạn.",
  },
  VEHICLE_CREATED: {
    title: "Đã thêm xe mới",
    message: "Bạn vừa thêm một xe vào tài khoản Carivo.",
  },
  VEHICLE_UPDATED: {
    title: "Thông tin xe đã cập nhật",
    message: "Thông tin xe của bạn vừa được cập nhật.",
  },
};

const PROMOTION: Record<string, LocalizedPair> = {
  PROMOTION: {
    title: "Khuyến mãi mới",
    message: "Có chương trình khuyến mãi mới dành cho bạn.",
  },
  PROMOTION_CREATED: {
    title: "Khuyến mãi mới",
    message: "Có chương trình khuyến mãi mới dành cho bạn.",
  },
};

const SURVEY: Record<string, LocalizedPair> = {
  SURVEY_REQUEST: {
    title: "Khảo sát trải nghiệm dịch vụ",
    message: "Hoàn thành khảo sát sau dịch vụ để nhận điểm thưởng.",
  },
};

const REVIEW: Record<string, LocalizedPair> = {
  REVIEW_REQUEST: {
    title: "Chia sẻ trải nghiệm của bạn",
    message: "Đánh giá garage và dịch vụ để nhận điểm thưởng.",
  },
  REVIEW_REPLIED: {
    title: "Garage đã phản hồi đánh giá",
    message: "Garage vừa gửi phản hồi cho đánh giá của bạn.",
  },
  REVIEW_HIDDEN: {
    title: "Đánh giá đã được kiểm duyệt",
    message: "Đánh giá của bạn đã được ẩn. Mở để xem chi tiết.",
  },
  REVIEW_PUBLISHED: {
    title: "Đánh giá đã được công khai",
    message: "Đánh giá của bạn hiện đã được hiển thị công khai.",
  },
};

const LOYALTY: Record<string, LocalizedPair> = {
  LOYALTY: {
    title: "Điểm thưởng được cập nhật",
    message: "Điểm thưởng Carivo của bạn vừa được cập nhật.",
  },
  LOYALTY_POINTS_EARNED: {
    title: "Bạn vừa nhận điểm thưởng",
    message: "Điểm thưởng đã được cộng vào tài khoản Carivo của bạn.",
  },
  LOYALTY_POINTS_REDEEMED: {
    title: "Đã dùng điểm thưởng",
    message: "Điểm thưởng đã được dùng cho lịch hẹn của bạn.",
  },
  LOYALTY_TIER_UPGRADED: {
    title: "Thăng hạng thành viên",
    message:
      "Chúc mừng! Bạn vừa được nâng hạng thành viên Carivo.",
  },
  FEEDBACK_REWARD_EARNED: {
    title: "Đã nhận điểm thưởng phản hồi",
    message: "Điểm thưởng đã được cộng vào tài khoản Carivo của bạn.",
  },
};

const TABLES: Record<string, Record<string, LocalizedPair>> = {
  BOOKING,
  WAITLIST,
  CUSTOMER_CASE,
  CASE: CUSTOMER_CASE,
  VEHICLE,
  PROMOTION,
  SURVEY,
  REVIEW,
  LOYALTY,
};

function pickBucket(item: NotificationItem): string | null {
  const candidates = [
    item.type,
    item.type?.split("_")[0],
    item.related_type,
  ].filter(Boolean) as string[];
  for (const raw of candidates) {
    const upper = String(raw).toUpperCase();
    if (TABLES[upper]) return upper;
    if (upper.includes("BOOKING")) return "BOOKING";
    if (upper.includes("WAITLIST")) return "WAITLIST";
    if (upper.includes("CASE")) return "CUSTOMER_CASE";
    if (upper.includes("VEHICLE")) return "VEHICLE";
    if (upper.includes("PROMOTION")) return "PROMOTION";
    if (upper.includes("SURVEY")) return "SURVEY";
    if (upper.includes("REVIEW")) return "REVIEW";
    if (upper.includes("FEEDBACK_REWARD")) return "LOYALTY";
    if (upper.includes("FEEDBACK")) return "BOOKING";
    if (upper.includes("LOYALTY")) return "LOYALTY";
  }
  return null;
}

export function localizeNotification(item: NotificationItem): {
  title: string;
  message: string;
} {
  const bucket = pickBucket(item);
  const typeKey = item.type?.toUpperCase();

  const localized = (() => {
    if (bucket && typeKey && TABLES[bucket]?.[typeKey]) {
      return TABLES[bucket][typeKey];
    }
    if (bucket && typeKey) {
      // Fallback by prefix (e.g. BOOKING_X -> BOOKING)
      for (const key of Object.keys(TABLES[bucket] ?? {})) {
        if (typeKey.startsWith(key)) return TABLES[bucket][key];
      }
      const fallback = Object.values(TABLES[bucket] ?? {})[0];
      if (fallback) return fallback;
    }
    return null;
  })();

  // BE đã trả tiếng Việt → dùng nguyên văn
  if (isVietnamese(item.title) || isVietnamese(item.message)) {
    return {
      title: item.title ?? localized?.title ?? "Thông báo",
      message: item.message ?? localized?.message ?? "",
    };
  }

  // Ưu tiên bản tiếng Việt từ helper, fallback về text BE
  return {
    title: localized?.title ?? item.title ?? "Thông báo",
    message: localized?.message ?? item.message ?? "",
  };
}
