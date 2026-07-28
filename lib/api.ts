import type {
  ApiEnvelope,
  AuthTokenPayload,
  AvailableSlotsPayload,
  Booking,
  BookingHandover,
  BookingIncident,
  BookingIncidentActiveResponse,
  BookingInspection,
  CustomerCase,
  CustomerCaseDetailResponse,
  CustomerCaseStatus,
  CustomerPaymentResponse,
  CustomerVoucher,
  FavoriteGarage,
  Garage,
  GarageReview,
  LoyaltySummary,
  LoyaltyTierRule,
  LoyaltyTransaction,
  NotificationItem,
  PaymentTransaction,
  PriceQuote,
  PhoneVerificationChallenge,
  PhoneVerificationToken,
  Promotion,
  ServicePackage,
  Survey,
  SurveyQuestion,
  UserPublic,
  Vehicle,
  VoucherStatus,
  Waitlist,
  WashHistory,
  WashHistoryClaimResult,
} from "@/lib/types";

const API_ROOT = "https://wdp301-project-backend.onrender.com/api/v1";

export type QueryValue = string | number | boolean | null | undefined | string[];

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  body?: BodyInit | Record<string, unknown>;
  headers?: HeadersInit;
  isFormData?: boolean;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  token?: string | null;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_ROOT}${path}`);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        url.searchParams.set(key, value.join(","));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const { body, headers, isFormData, method = "GET", query, token } = options;
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!body || isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body:
      body && typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : (body as BodyInit | undefined),
    credentials: "include",
  });

  const rawText = await response.text();
  const payload = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message =
      getPayloadMessage(payload) ||
      response.statusText ||
      "Yeu cau that bai";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = (payload as { message?: unknown }).message;
  return typeof candidate === "string" ? candidate : null;
}

export const api = {
  requestPhoneVerification(
    phone: string,
    purpose: "REGISTER" | "CHANGE_PHONE" = "REGISTER"
  ) {
    return request<ApiEnvelope<PhoneVerificationChallenge>>(
      "/auth/phone-verifications/request",
      {
        method: "POST",
        body: { phone, purpose },
      }
    );
  },

  verifyPhoneOtp(challengeId: string, otp: string) {
    return request<ApiEnvelope<PhoneVerificationToken>>(
      "/auth/phone-verifications/verify",
      {
        method: "POST",
        body: { challenge_id: challengeId, otp },
      }
    );
  },

  register(body: {
    phone: string;
    password: string;
    email?: string;
    full_name?: string;
    phone_verification_token: string;
  }) {
    return request<ApiEnvelope<{ user: UserPublic }>>("/auth/register", {
      method: "POST",
      body,
    });
  },

  login(phone: string, password: string) {
    return request<ApiEnvelope<AuthTokenPayload>>("/auth/login", {
      method: "POST",
      body: { phone, password },
    });
  },

  refreshToken() {
    return request<ApiEnvelope<AuthTokenPayload>>("/auth/refresh", {
      method: "POST",
    });
  },

  logout(token?: string | null) {
    return request<ApiEnvelope<{ message?: string }>>("/auth/logout", {
      method: "POST",
      token,
    });
  },

  getCurrentAuthUser(token: string) {
    return request<ApiEnvelope<{ user: UserPublic } | UserPublic>>("/auth/me", {
      token,
    });
  },

  forgotPassword(phone: string) {
    return request<ApiEnvelope<{ message?: string }>>("/auth/forgot-password", {
      method: "POST",
      body: { phone },
    });
  },

  resetPassword(phone: string, resetToken: string, newPassword: string) {
    return request<ApiEnvelope<{ message?: string }>>("/auth/reset-password", {
      method: "POST",
      body: {
        phone,
        reset_token: resetToken,
        new_password: newPassword,
      },
    });
  },

  getProfile(token: string) {
    return request<ApiEnvelope<UserPublic>>("/users/me", { token });
  },

  updateProfile(
    token: string,
    body: {
      full_name?: string;
      email?: string | null;
      avatar_url?: string | null;
      phone?: string;
      current_password?: string;
      phone_verification_token?: string;
    }
  ) {
    return request<ApiEnvelope<UserPublic>>("/users/me", {
      method: "PATCH",
      token,
      body,
    });
  },

  getGarages(query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<Garage[]>>("/garages", { query });
  },

  getGarage(id: string) {
    return request<ApiEnvelope<Garage>>(`/garages/${id}`);
  },

  getServicePackages(query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<ServicePackage[]>>("/service-packages", {
      query,
    });
  },

  getServicePackage(id: string) {
    return request<ApiEnvelope<ServicePackage>>(`/service-packages/${id}`);
  },

  getPromotions(query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<Promotion[]>>("/promotions", { query });
  },

  validatePromotion(
    token: string,
    promotionCode: string,
    servicePackageId: string,
    quoteId?: string
  ) {
    return request<
      ApiEnvelope<{
        promotion: Promotion;
        discount_amount: number;
        final_price: number;
      }>
    >("/promotions/validate", {
      method: "POST",
      token,
      body: {
        promotion_code: promotionCode,
        service_package_id: servicePackageId,
        quote_id: quoteId,
      },
    });
  },

  getAvailableSlots(
    params: {
      garage_id: string;
      service_package_id: string;
      vehicle_id?: string;
      add_on_service_ids?: string[];
      date?: string;
      start_date?: string;
      days?: number;
    },
    token?: string | null
  ) {
    return request<ApiEnvelope<AvailableSlotsPayload>>("/bookings/available-slots", {
      query: params,
      token,
    });
  },

  createPriceQuote(
    token: string,
    body: {
      garage_id: string;
      vehicle_id: string;
      service_package_id: string;
      add_on_service_ids?: string[];
      effective_at?: string;
    }
  ) {
    return request<ApiEnvelope<PriceQuote>>("/pricing/quotes", {
      method: "POST",
      token,
      body,
    });
  },

  getVehicles(token: string, query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<Vehicle[]>>("/vehicles", { token, query });
  },

  createVehicle(
    token: string,
    body: {
      raw_license_plate: string;
      vehicle_type: "MOTORBIKE" | "CAR";
      engine_type: "GASOLINE" | "ELECTRIC";
      motorbike_cc_group?: "UNDER_175CC" | "OVER_175CC";
      car_body_type?:
        | "HATCHBACK"
        | "SEDAN"
        | "SUV"
        | "MPV"
        | "PICKUP"
        | "VAN";
      seat_count?: number;
      brand?: string;
      model?: string;
      color?: string;
      is_default?: boolean;
    }
  ) {
    return request<ApiEnvelope<Vehicle>>("/vehicles", {
      method: "POST",
      token,
      body,
    });
  },

  updateVehicle(
    token: string,
    id: string,
    body: Record<string, unknown>
  ) {
    return request<ApiEnvelope<Vehicle>>(`/vehicles/${id}`, {
      method: "PATCH",
      token,
      body,
    });
  },

  deleteVehicle(token: string, id: string) {
    return request<ApiEnvelope<Vehicle>>(`/vehicles/${id}`, {
      method: "DELETE",
      token,
    });
  },

  getBookings(token: string, query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<Booking[]>>("/bookings", { token, query });
  },

  createBooking(
    token: string,
    body: {
      garage_id: string;
      vehicle_id: string;
      service_package_id: string;
      add_on_service_ids?: string[];
      quote_id?: string;
      start_time: string;
      promotion_code?: string;
      voucher_code?: string;
      used_points?: number;
      note?: string;
    }
  ) {
    return request<ApiEnvelope<Booking>>("/bookings", {
      method: "POST",
      token,
      body,
    });
  },

  cancelBooking(token: string, id: string, reason?: string) {
    return request<ApiEnvelope<Booking>>(`/bookings/${id}/cancel`, {
      method: "PATCH",
      token,
      body: reason ? { reason } : {},
    });
  },

  getLoyaltySummary(token: string) {
    return request<ApiEnvelope<LoyaltySummary>>("/loyalty/me", { token });
  },

  getLoyaltyTransactions(token: string) {
    return request<ApiEnvelope<LoyaltyTransaction[]>>(
      "/loyalty/me/transactions",
      { token }
    );
  },

  getLoyaltyTierRules(token?: string | null) {
    return request<ApiEnvelope<LoyaltyTierRule[]>>("/loyalty/tier-rules", {
      token: token ?? undefined,
    });
  },

  redeemPreview(
    token: string,
    body: {
      service_package_id: string;
      quote_id?: string;
      promotion_id?: string;
      promotion_code?: string;
      voucher_code?: string;
      used_points: number;
    }
  ) {
    return request<
      ApiEnvelope<{
        original_price?: number;
        discount_amount?: number;
        final_price?: number;
        points_value?: number;
        points_discount?: number;
      }>
    >("/loyalty/redeem-preview", {
      method: "POST",
      token,
      body,
    });
  },

  getNotifications(token: string) {
    return request<ApiEnvelope<NotificationItem[]>>("/notifications", { token });
  },

  getUnreadNotificationCount(token: string) {
    return request<ApiEnvelope<{ unread_count: number }>>(
      "/notifications/unread-count",
      { token }
    );
  },

  markAllNotificationsRead(token: string) {
    return request<ApiEnvelope<{ modified_count: number }>>(
      "/notifications/mark-all-read",
      {
        method: "PATCH",
        token,
      }
    );
  },

  markNotificationRead(token: string, id: string) {
    return request<ApiEnvelope<NotificationItem>>(`/notifications/${id}/read`, {
      method: "PATCH",
      token,
    });
  },

  deleteNotification(token: string, id: string) {
    return request<ApiEnvelope<NotificationItem>>(`/notifications/${id}`, {
      method: "DELETE",
      token,
    });
  },

  getWashHistories(token: string, query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<WashHistory[]>>("/wash-histories", {
      token,
      query,
    });
  },

  getAvailableSurveys(token: string, bookingId: string) {
    return request<ApiEnvelope<Survey[]>>("/surveys/available", {
      token,
      query: { booking_id: bookingId },
    });
  },

  logoutAll(token: string) {
    return request<ApiEnvelope<{ message?: string }>>("/auth/logout-all", {
      method: "POST",
      token,
    });
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<ApiEnvelope<{ message?: string }>>("/auth/change-password", {
      method: "POST",
      token,
      body: { current_password: currentPassword, new_password: newPassword },
    });
  },

  getBooking(token: string, id: string) {
    return request<ApiEnvelope<Booking>>(`/bookings/${id}`, { token });
  },

  createPayosPayment(token: string, bookingId: string) {
    return request<ApiEnvelope<CustomerPaymentResponse>>(
      `/payments/bookings/${bookingId}/payos`,
      {
        method: "POST",
        token,
        body: {},
      }
    );
  },

  getPayosPayment(token: string, bookingId: string) {
    return request<ApiEnvelope<CustomerPaymentResponse>>(
      `/payments/bookings/${bookingId}/payos`,
      { token }
    );
  },

  cancelPayosPayment(token: string, paymentId: string, reason?: string) {
    return request<ApiEnvelope<{ payment: PaymentTransaction }>>(
      `/admin/payments/${paymentId}/cancel`,
      {
        method: "PATCH",
        token,
        body: reason ? { reason } : {},
      }
    );
  },

  getVehicle(token: string, id: string) {
    return request<ApiEnvelope<Vehicle>>(`/vehicles/${id}`, { token });
  },

  getPromotion(id: string) {
    return request<ApiEnvelope<Promotion>>(`/promotions/${id}`);
  },

  getWashHistory(token: string, id: string) {
    return request<ApiEnvelope<WashHistory>>(`/wash-histories/${id}`, { token });
  },

  uploadFile(token: string, formData: FormData) {
    return request<ApiEnvelope<{ url: string; id: string }>>("/uploads", {
      method: "POST",
      token,
      body: formData,
      isFormData: true,
    });
  },

  deleteUpload(token: string, id: string) {
    return request<ApiEnvelope<{ message?: string }>>(`/uploads/${id}`, {
      method: "DELETE",
      token,
    });
  },

  // ===== Customer Vouchers =====
  getMyVouchers(
    token: string,
    query?: Record<string, QueryValue> & { status?: VoucherStatus }
  ) {
    return request<ApiEnvelope<CustomerVoucher[]>>("/customer-vouchers/my", {
      token,
      query,
    });
  },

  validateVoucher(
    token: string,
    voucherCode: string,
    servicePackageId: string,
    quoteId?: string
  ) {
    return request<
      ApiEnvelope<{
        voucher: CustomerVoucher;
        discount_amount: number;
        final_price: number;
      }>
    >("/customer-vouchers/validate", {
      method: "POST",
      token,
      body: {
        code: voucherCode,
        service_package_id: servicePackageId,
        quote_id: quoteId,
      },
    });
  },

  // ===== Garage Favorites =====
  getFavoriteGarages(token: string) {
    return request<ApiEnvelope<FavoriteGarage[]>>("/garages/favorites", {
      token,
    });
  },

  toggleGarageFavorite(token: string, garageId: string) {
    return request<ApiEnvelope<{ favorited: boolean }>>(
      `/garages/${garageId}/favorite`,
      {
        method: "POST",
        token,
        body: {},
      }
    );
  },

  // ===== Garage Reviews =====
  getGarageReviews(garageId: string, query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<GarageReview[]>>(
      `/garages/${garageId}/reviews`,
      { query }
    );
  },

  createGarageReview(
    token: string,
    garageId: string,
    body: { booking_id: string; rating: number; comment?: string }
  ) {
    return request<ApiEnvelope<GarageReview>>(
      `/garages/${garageId}/reviews`,
      {
        method: "POST",
        token,
        body,
      }
    );
  },

  // ===== Customer Cases =====
  getMyCustomerCases(
    token: string,
    query?: Record<string, QueryValue> & {
      status?: CustomerCaseStatus;
      category?: string;
      booking_id?: string;
      case_code?: string;
    }
  ) {
    return request<ApiEnvelope<CustomerCase[]>>("/customer-cases", {
      token,
      query,
    });
  },

  getCustomerCaseDetail(token: string, id: string) {
    return request<ApiEnvelope<CustomerCaseDetailResponse>>(
      `/customer-cases/${id}`,
      { token }
    );
  },

  // ===== Survey responses =====
  submitSurveyResponse(
    token: string,
    surveyId: string,
    body: { booking_id: string; answers: { question_id: string; value: unknown }[] }
  ) {
    return request<ApiEnvelope<unknown>>(`/surveys/${surveyId}/responses`, {
      method: "POST",
      token,
      body,
    });
  },

  // ===== Waitlist (customer) =====
  getWaitlists(
    token: string,
    query?: Record<string, QueryValue> & {
      status?: "WAITING" | "OFFERED" | "ACCEPTED" | "CANCELED" | "EXPIRED";
    }
  ) {
    return request<ApiEnvelope<Waitlist[]>>("/waitlists", { token, query });
  },

  getWaitlist(token: string, id: string) {
    return request<ApiEnvelope<Waitlist>>(`/waitlists/${id}`, { token });
  },

  createWaitlist(
    token: string,
    body: {
      garage_id: string;
      vehicle_id: string;
      service_package_id: string;
      add_on_service_ids?: string[];
      desired_start_time: string;
      note?: string;
    }
  ) {
    return request<ApiEnvelope<Waitlist>>("/waitlists", {
      method: "POST",
      token,
      body,
    });
  },

  acceptWaitlist(token: string, id: string) {
    return request<ApiEnvelope<Waitlist>>(`/waitlists/${id}/accept`, {
      method: "PATCH",
      token,
      body: {},
    });
  },

  cancelWaitlist(token: string, id: string, reason?: string) {
    return request<ApiEnvelope<Waitlist>>(`/waitlists/${id}/cancel`, {
      method: "PATCH",
      token,
      body: reason ? { reason } : {},
    });
  },

  // ===== Booking inspections =====
  getBookingInspections(token: string, bookingId: string) {
    return request<ApiEnvelope<BookingInspection[]>>(
      `/bookings/${bookingId}/inspections`,
      { token }
    );
  },

  // ===== Wash history =====
  claimWashHistory(token: string) {
    return request<ApiEnvelope<WashHistoryClaimResult>>(
      "/wash-histories/claim",
      {
        method: "POST",
        token,
        body: {},
      }
    );
  },

  // ===== Garages (search/nearby) =====
  getNearbyGarages(query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<Garage[]>>("/garages/nearby", { query });
  },

  // ===== Service package add-ons =====
  getAddOnServices(query?: Record<string, QueryValue>) {
    return request<ApiEnvelope<ServicePackage[]>>("/service-packages", {
      query: { ...query, service_type: "ADDON" },
    });
  },

  // ===== Booking Handover (customer) =====
  getMyHandover(token: string, bookingId: string) {
    return request<ApiEnvelope<BookingHandover>>(
      `/bookings/${bookingId}/handover`,
      { token }
    );
  },

  acceptMyHandover(token: string, bookingId: string, note?: string) {
    return request<ApiEnvelope<BookingHandover>>(
      `/bookings/${bookingId}/handover/accept`,
      {
        method: "POST",
        token,
        body: note ? { note } : {},
      }
    );
  },

  reportHandoverIssue(
    token: string,
    bookingId: string,
    body: {
      category: string;
      description: string;
      damage_location?: string;
      desired_resolution?: string;
      discovered_at?: string;
      vehicle_received?: boolean;
      upload_ids?: string[];
    }
  ) {
    return request<ApiEnvelope<CustomerCaseDetailResponse>>(
      `/bookings/${bookingId}/handover/report`,
      {
        method: "POST",
        token,
        body,
      }
    );
  },

  // ===== Booking Incident (customer) =====
  getMyActiveBookingIncident(token: string, bookingId: string) {
    return request<ApiEnvelope<BookingIncidentActiveResponse | null>>(
      `/bookings/${bookingId}/incidents/active`,
      { token }
    );
  },

  resolveMyBookingIncident(
    token: string,
    bookingId: string,
    incidentId: string,
    body: {
      decision:
        | "REASSIGN_AND_CONTINUE"
        | "RESCHEDULE_NEAREST"
        | "RESCHEDULE_CUSTOM"
        | "CANCEL_BY_GARAGE";
      new_start_time?: string;
      continuation_policy?: "RESUME_REMAINING" | "RESTART_CURRENT_ITEM";
      customer_note?: string;
    }
  ) {
    return request<ApiEnvelope<BookingIncident>>(
      `/bookings/${bookingId}/incidents/${incidentId}/decision`,
      {
        method: "PATCH",
        token,
        body,
      }
    );
  },

  // ===== Customer Case (extended) =====
  addCaseEvidence(
    token: string,
    caseId: string,
    uploadIds: string[]
  ) {
    return request<ApiEnvelope<CustomerCaseDetailResponse>>(
      `/customer-cases/${caseId}/evidence`,
      {
        method: "POST",
        token,
        body: { upload_ids: uploadIds },
      }
    );
  },

  postCaseMessage(
    token: string,
    caseId: string,
    body: { message: string; upload_ids?: string[] }
  ) {
    return request<ApiEnvelope<CustomerCaseDetailResponse>>(
      `/customer-cases/${caseId}/messages`,
      {
        method: "POST",
        token,
        body,
      }
    );
  },

  respondCaseResolution(
    token: string,
    caseId: string,
    body: { resolution_id: string; accepted: boolean; note?: string }
  ) {
    return request<ApiEnvelope<CustomerCaseDetailResponse>>(
      `/customer-cases/${caseId}/resolution-response`,
      {
        method: "PATCH",
        token,
        body,
      }
    );
  },

  reopenCase(token: string, caseId: string, reason: string) {
    return request<ApiEnvelope<CustomerCaseDetailResponse>>(
      `/customer-cases/${caseId}/reopen`,
      {
        method: "POST",
        token,
        body: { reason },
      }
    );
  },
};
