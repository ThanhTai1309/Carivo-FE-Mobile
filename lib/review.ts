import { ApiError } from "@/lib/api";
import type { ReviewModerationStatus } from "@/lib/types";

const ELIGIBILITY_MESSAGES: Record<string, string> = {
  REVIEW_ALREADY_EXISTS: "Booking này đã có đánh giá. Bạn có thể chỉnh sửa đánh giá hiện tại.",
  REVIEW_ALREADY_DELETED: "Đánh giá của booking này đã được xóa và không thể tạo lại.",
  REVIEW_BOOKING_NOT_COMPLETED: "Bạn chỉ có thể đánh giá sau khi booking hoàn thành.",
  REVIEW_BOOKING_NOT_SETTLED: "Booking cần được thanh toán hoặc miễn thanh toán trước khi đánh giá.",
  REVIEW_WASH_HISTORY_REQUIRED: "Chưa có lịch sử dịch vụ hợp lệ để đánh giá booking này.",
};

const API_ERROR_MESSAGES: Record<string, string> = {
  REVIEW_NOT_FOUND: "Không tìm thấy đánh giá.",
  REVIEW_ALREADY_EXISTS: ELIGIBILITY_MESSAGES.REVIEW_ALREADY_EXISTS,
  REVIEW_ALREADY_DELETED: ELIGIBILITY_MESSAGES.REVIEW_ALREADY_DELETED,
  REVIEW_BOOKING_NOT_COMPLETED: ELIGIBILITY_MESSAGES.REVIEW_BOOKING_NOT_COMPLETED,
  REVIEW_BOOKING_NOT_SETTLED: ELIGIBILITY_MESSAGES.REVIEW_BOOKING_NOT_SETTLED,
  REVIEW_WASH_HISTORY_REQUIRED: ELIGIBILITY_MESSAGES.REVIEW_WASH_HISTORY_REQUIRED,
  REVIEW_UPLOAD_IMAGE_REQUIRED: "Đánh giá chỉ chấp nhận tệp hình ảnh.",
  INVALID_REVIEW_UPLOADS: "Một hoặc nhiều ảnh không hợp lệ hoặc không thuộc tài khoản của bạn.",
  DUPLICATE_REVIEW_UPLOADS: "Danh sách ảnh đánh giá đang bị trùng.",
};

function getErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = body as {
    code?: unknown;
    error?: { code?: unknown };
  };
  if (typeof value.code === "string") return value.code;
  if (typeof value.error?.code === "string") return value.error.code;
  return null;
}

export function getReviewEligibilityMessage(reasonCode?: string | null) {
  if (!reasonCode) return "";
  return ELIGIBILITY_MESSAGES[reasonCode] ?? "Booking này hiện chưa đủ điều kiện đánh giá.";
}

export function getReviewErrorMessage(
  error: unknown,
  fallback = "Không thể xử lý đánh giá lúc này."
) {
  if (!(error instanceof ApiError)) return fallback;
  const code = getErrorCode(error.body);
  if (code && API_ERROR_MESSAGES[code]) return API_ERROR_MESSAGES[code];
  return error.message || fallback;
}

export function getModerationLabel(status?: ReviewModerationStatus) {
  if (status === "HIDDEN") return "Đã ẩn";
  return "Công khai";
}

export function getModerationReasonLabel(reason?: string | null) {
  const labels: Record<string, string> = {
    SPAM: "Nội dung rác hoặc quảng cáo",
    OFFENSIVE_LANGUAGE: "Ngôn từ không phù hợp",
    PERSONAL_INFORMATION: "Chứa thông tin cá nhân",
    IRRELEVANT_CONTENT: "Nội dung không liên quan",
    OTHER: "Lý do khác",
  };
  return reason ? labels[reason] ?? reason : "";
}
