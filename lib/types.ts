export type Role = "CUSTOMER" | "ADMIN" | "STAFF" | string;

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  };
}

export interface UserPublic {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: Role;
  is_active?: boolean;
}

export interface AuthTokenPayload {
  access_token: string;
  user: UserPublic;
}

export interface PhoneVerificationChallenge {
  challenge_id: string;
  phone: string;
  purpose: "REGISTER" | "CHANGE_PHONE";
  expires_at: string;
  retry_after_seconds?: number;
  debug_otp?: string | null;
}

export interface PhoneVerificationToken {
  verification_token: string;
  phone: string;
  purpose: "REGISTER" | "CHANGE_PHONE";
  expires_at: string;
}

export interface Garage {
  id: string;
  name: string;
  garage_code?: string;
  phone?: string | null;
  email?: string | null;
  address?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_time?: string | null;
  closing_time?: string | null;
  slot_interval_minutes?: number;
  late_grace_minutes?: number;
  description?: string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  rating_average?: number | null;
  rating_count?: number | null;
  is_active?: boolean;
}

export interface BookingInspection {
  id: string;
  booking_id: string;
  inspector_id?: string | null;
  vehicle_condition?: string | null;
  notes?: string | null;
  inspection_images?: string[];
  created_at: string;
  updated_at?: string;
}

export type VehicleType = "MOTORBIKE" | "CAR";
export type EngineType = "GASOLINE" | "ELECTRIC";

export interface Vehicle {
  id: string;
  raw_license_plate: string;
  normalized_license_plate?: string;
  vehicle_type: VehicleType;
  engine_type: EngineType;
  motorbike_cc_group?: "UNDER_175CC" | "OVER_175CC" | null;
  car_body_type?:
    | "HATCHBACK"
    | "SEDAN"
    | "SUV"
    | "MPV"
    | "PICKUP"
    | "VAN"
    | null;
  seat_count?: number | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  description?: string | null;
  vehicle_type: VehicleType;
  service_type?: "WASH" | "ADDON" | "COMBO" | string;
  base_price: number;
  duration_minutes: number;
  requires_wash_bay?: boolean;
  requires_care_staff?: boolean;
  is_active?: boolean;
  is_popular?: boolean;
  image_url?: string | null;
  display_price?: number | null;
  discount_percentage?: number | null;
  rating_average?: number | null;
  rating_count?: number | null;
}

export interface PriceQuote {
  id: string;
  garage_id: string;
  vehicle_id: string | null;
  vehicle_snapshot: {
    vehicle_type: VehicleType;
    engine_type: EngineType | null;
    motorbike_cc_group: "UNDER_175CC" | "OVER_175CC" | null;
    car_body_type:
      | "HATCHBACK"
      | "SEDAN"
      | "SUV"
      | "MPV"
      | "PICKUP"
      | "VAN"
      | null;
    seat_count: number | null;
  };
  service_package_id: string;
  add_on_service_ids: string[];
  items: Array<{
    service_package_id: string;
    service_price_rule_id: string | null;
    rule_version: number | null;
    source: "PRIMARY" | "ADD_ON";
    name_snapshot: string;
    price_snapshot: number;
    duration_minutes: number;
  }>;
  subtotal: number;
  total_duration_minutes: number;
  effective_at: string;
  expires_at: string;
}

export type PromotionDiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discount_type: PromotionDiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number;
  applicable_vehicle_types?: VehicleType[];
  applicable_service_package_ids?: string[];
  start_at?: string | null;
  end_at?: string | null;
  is_active?: boolean;
  usage_limit?: number | null;
  usage_count?: number;
  per_customer_limit?: number | null;
}

export interface LoyaltyAccount {
  id: string;
  customer_id?: string;
  current_tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | string;
  total_points: number;
  available_points: number;
  redeemed_points: number;
  expired_points: number;
  total_spent: number;
  total_visits: number;
  last_visit_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltySummary {
  loyalty: LoyaltyAccount;
  current_tier_rule?: LoyaltyTierRule | null;
  next_tier_rule?: LoyaltyTierRule | null;
}

export interface LoyaltyTransaction {
  id: string;
  type?: string;
  direction?: "EARN" | "SPEND" | string;
  points: number;
  description?: string;
  created_at: string;
}

export interface LoyaltyTierRule {
  id: string;
  tier_name: string;
  booking_window_days?: number;
  max_upcoming_bookings?: number;
  point_multiplier?: number;
  priority_level?: number;
  min_total_spent?: number;
  min_total_visits?: number;
  min_total_points?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SlotUnavailableReason =
  | "VEHICLE_BOOKING_OVERLAP"
  | "WASH_BAY_CAPACITY_FULL"
  | "CARE_STAFF_CAPACITY_FULL"
  | string;

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  unavailable_reasons?: SlotUnavailableReason[];
  available_capacity?: number | null;
  available_wash_bay_capacity?: number | null;
  available_care_staff_capacity?: number | null;
  wash_bay_start_time?: string | null;
  wash_bay_end_time?: string | null;
  wash_bay_work_end_time?: string | null;
  wash_bay_reserved_until?: string | null;
  care_staff_start_time?: string | null;
  care_staff_end_time?: string | null;
  care_staff_work_end_time?: string | null;
  care_staff_reserved_until?: string | null;
  booking_items?: Array<Record<string, unknown>>;
}

export interface AvailableSlotDay {
  date: string;
  opening_time?: string;
  closing_time?: string;
  latest_start_time?: string | null;
  has_available_slots: boolean;
  reason?:
    | "DATE_IN_PAST"
    | "NO_FUTURE_SLOT_TODAY"
    | "BOOKING_WINDOW_EXCEEDED"
    | "NO_CONTINUOUS_SLOT_AVAILABLE"
    | null;
  available_slots?: AvailableSlot[];
  slots?: AvailableSlot[];
}

export interface AvailableSlotsPayload {
  garage_id: string;
  vehicle_id?: string | null;
  service_package_id: string;
  add_on_service_ids?: string[];
  date?: string;
  start_date?: string;
  requested_days?: number;
  generated_at?: string;
  booking_tier?: string;
  booking_window_days?: number;
  booking_window_end?: string;
  vehicle_type?: VehicleType;
  service_duration_minutes?: number;
  requires_wash_bay?: boolean;
  requires_care_staff?: boolean;
  care_staff_type?: string | null;
  care_staff_required_count?: number;
  slot_interval_minutes?: number;
  active_wash_bay_count?: number | null;
  active_care_staff_count?: number | null;
  has_available_slots?: boolean;
  days?: AvailableSlotDay[];
  available_slots?: AvailableSlot[];
  slots?: AvailableSlot[];
}

export type BookingPaymentStatus = "UNPAID" | "PENDING" | "PAID" | string;
export type BookingPaymentMethod = "CASH" | "PAYOS" | string;
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW"
  | string;
export type BookingOperationStatus = "NORMAL" | "AWAITING_CUSTOMER_DECISION" | string;
export type BookingArrivalStatus = "EARLY" | "ON_TIME" | "LATE" | string;
export type BookingCancellationSource =
  | "CUSTOMER"
  | "STAFF_CUSTOMER_REQUEST"
  | "GARAGE_INCIDENT"
  | "ADMIN_CORRECTION"
  | string;

export interface BookingVoucher {
  id: string;
  code?: string | null;
  voucher_kind?: string | null;
  discount_amount?: number | null;
  status?: string | null;
}

export interface Booking {
  id: string;
  garage_id: string;
  vehicle_id?: string | null;
  service_package_id: string;
  booking_date?: string;
  start_time: string;
  end_time?: string;
  original_price?: number;
  promotion_discount_amount?: number;
  points_discount_amount?: number;
  voucher_discount_amount?: number;
  discount_amount?: number;
  final_price?: number;
  payment_status?: BookingPaymentStatus;
  payment_method?: BookingPaymentMethod;
  is_walk_in?: boolean;
  is_rework?: boolean;
  vehicle_type?: VehicleType;
  status: BookingStatus;
  operation_status?: BookingOperationStatus;
  active_incident_id?: string | null;
  arrival_status?: BookingArrivalStatus | null;
  late_minutes?: number;
  reschedule_count?: number;
  original_start_time?: string | null;
  rescheduled_at?: string | null;
  rescheduled_by_id?: string | null;
  reschedule_reason?: string | null;
  promotion?: Promotion | null;
  customer_voucher?: BookingVoucher | null;
  promotion_id?: string | null;
  customer_voucher_id?: string | null;
  garage?: Garage | null;
  vehicle?: Vehicle | null;
  service_package?: ServicePackage | null;
  note?: string | null;
  used_points?: number;
  earned_points?: number;
  paid_at?: string | null;
  completed_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  cancellation_source?: BookingCancellationSource | null;
  reward_processed?: boolean;
  active_payment_id?: string | null;
  active_payment?: PaymentTransaction | null;
  created_at?: string;
  updated_at?: string;
}

export type PaymentProvider = "PAYOS" | string;
export type PaymentMethod = "QR" | string;
export type PaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "CANCELING"
  | "PAID"
  | "CANCELED"
  | "EXPIRED"
  | "FAILED"
  | string;
export type PaymentInitiatedRole = "CUSTOMER" | "STAFF" | "ADMIN" | string;
export type PaymentInitiatedChannel =
  | "CUSTOMER_SELF_SERVICE"
  | "STAFF_ASSISTED"
  | string;

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  order_code: number;
  payment_link_id?: string | null;
  checkout_url: string | null;
  qr_code: string | null;
  amount: number;
  currency: string;
  description?: string | null;
  status: PaymentStatus;
  paid_at?: string | null;
  expires_at?: string | null;
  canceled_at?: string | null;
  expired_at?: string | null;
  created_by_staff_id?: string | null;
  initiated_by_user_id?: string | null;
  initiated_by_role?: PaymentInitiatedRole | null;
  initiated_channel?: PaymentInitiatedChannel | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPaymentResponse {
  payment: PaymentTransaction;
  reused: boolean;
  poll_after_ms: number | null;
}

export interface AdminPaymentResponse {
  booking: Booking;
  payment: PaymentTransaction;
  reused?: boolean;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  related_type?: string;
  related_id?: string;
  in_app_status?: "UNREAD" | "READ" | string;
  read_at?: string | null;
  unread_count?: number;
  metadata?: Record<string, unknown> | null;
  icon?: string | null;
  action_url?: string | null;
  created_at: string;
}

export function isUnreadNotification(
  notification: Pick<NotificationItem, "in_app_status">
): boolean {
  return notification.in_app_status !== "READ";
}

export interface WashHistory {
  id: string;
  booking_id: string;
  amount_paid: number;
  original_price?: number;
  discount_amount: number;
  points_earned: number;
  points_used: number;
  payment_method?: string;
  paid_at?: string;
  service_started_at?: string | null;
  service_completed_at?: string;
  created_at?: string;
  vehicle_type?: VehicleType;
  booking?: {
    id: string;
    booking_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    status?: string;
    payment_status?: string;
  } | null;
  garage?: {
    id: string;
    name: string;
    garage_code?: string;
    address?: string;
    city?: string | null;
    is_active?: boolean;
  } | null;
  vehicle?: {
    id: string;
    raw_license_plate: string;
    normalized_license_plate?: string;
    vehicle_type: VehicleType;
    engine_type: EngineType;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    is_active?: boolean;
  } | null;
  wash_bay?: {
    id: string;
    name: string;
    bay_code?: string;
    vehicle_type?: VehicleType;
    status?: string;
    is_active?: boolean;
  } | null;
  service_package?: {
    id: string;
    name: string;
    vehicle_type: VehicleType;
    service_type?: string;
    base_price?: number;
    duration_minutes?: number;
    requires_wash_bay?: boolean;
    is_active?: boolean;
  } | null;
}

export interface WashHistoryClaimResult {
  matched_count?: number;
  claimed_count?: number;
  [key: string]: unknown;
}

export interface Waitlist {
  id: string;
  customer_id?: string;
  vehicle_id?: string;
  garage_id?: string;
  service_package_id?: string;
  add_on_service_ids?: string[];
  vehicle_type?: VehicleType;
  desired_start_time: string;
  status:
    | "WAITING"
    | "OFFERED"
    | "ACCEPTED"
    | "CANCELED"
    | "EXPIRED"
    | string;
  offered_at?: string | null;
  offer_expires_at?: string | null;
  accepted_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  expired_at?: string | null;
  created_booking_id?: string | null;
  source_booking_id?: string | null;
  note?: string | null;
  customer?: {
    id: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    role?: string;
    is_active?: boolean;
  } | null;
  vehicle?: {
    id: string;
    raw_license_plate: string;
    normalized_license_plate?: string;
    vehicle_type: VehicleType;
    engine_type: EngineType;
    brand?: string | null;
    model?: string | null;
    color?: string | null;
    is_active?: boolean;
  } | null;
  garage?: {
    id: string;
    name: string;
    garage_code?: string;
    address?: string;
    city?: string | null;
    is_active?: boolean;
  } | null;
  service_package?: {
    id: string;
    name: string;
    vehicle_type: VehicleType;
    service_type?: string;
    base_price?: number;
    duration_minutes?: number;
    is_active?: boolean;
  } | null;
  created_booking?: {
    id: string;
    start_time?: string | null;
    end_time?: string | null;
    status?: string;
    payment_status?: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: "RATING" | "NPS" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "TEXT";
  is_required: boolean;
  options?: string[];
  order: number;
}

export interface Survey {
  id: string;
  title: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  questions: SurveyQuestion[];
  response_expires_at?: string | null;
}

export type VoucherType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT"
  | "FREE_SERVICE"
  | string;

export type VoucherStatus =
  | "PENDING_APPROVAL"
  | "ISSUED"
  | "RESERVED"
  | "USED"
  | "EXPIRED"
  | "REVOKED"
  | string;

export type VoucherSourceType =
  | "INCIDENT"
  | "CUSTOMER_CASE"
  | "ADMIN_GIFT"
  | string;

export interface CustomerVoucherServicePackageRef {
  id: string;
  name?: string;
  service_type?: string;
  vehicle_type?: string;
  base_price?: number;
}

export interface CustomerVoucherGarageRef {
  id: string;
  name?: string;
  garage_code?: string;
}

export interface CustomerVoucherCustomerRef {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface CustomerVoucher {
  id: string;
  code: string;
  customer_id?: string | null;
  garage_id?: string | null;
  customer?: CustomerVoucherCustomerRef | null;
  garage?: CustomerVoucherGarageRef | null;
  source_type?: VoucherSourceType | null;
  source_booking_id?: string | null;
  source_incident_id?: string | null;
  source_customer_case_id?: string | null;
  source_customer_case_resolution_id?: string | null;
  voucher_type?: VoucherType | null;
  value?: number | null;
  max_discount_amount?: number | null;
  min_order_amount?: number | null;
  service_package_id?: string | null;
  service_package?: CustomerVoucherServicePackageRef | null;
  status?: VoucherStatus | null;
  expires_at?: string | null;
  note?: string | null;
  issued_by_id?: string | null;
  approved_by_id?: string | null;
  approved_at?: string | null;
  reserved_booking_id?: string | null;
  reserved_at?: string | null;
  used_at?: string | null;
  revoked_at?: string | null;
  revoked_by_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteGarage {
  garage_id: string;
  favorited_at?: string;
  garage?: Garage | null;
}

export type ReviewModerationStatus = "PUBLISHED" | "HIDDEN" | string;
export type ReviewSort = "NEWEST" | "HIGHEST" | "LOWEST";

export interface ReviewUpload {
  id: string;
  url: string;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ReviewGarageReply {
  content: string;
  replied_by_id?: string;
  replied_by?: {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
  } | null;
  replied_at?: string | null;
  updated_at?: string | null;
}

export interface GarageReview {
  id: string;
  garage_id: string;
  booking_id?: string | null;
  wash_history_id?: string | null;
  customer_id?: string | null;
  service_package_id?: string | null;
  garage?: {
    id: string;
    name?: string | null;
    garage_code?: string | null;
    address?: string | null;
    city?: string | null;
  } | null;
  service_package?: {
    id: string;
    name?: string | null;
    service_code?: string | null;
    vehicle_type?: string | null;
    service_type?: string | null;
  } | null;
  garage_rating: number;
  service_rating: number;
  rating: number;
  comment?: string | null;
  upload_ids?: string[];
  uploads?: ReviewUpload[];
  is_anonymous?: boolean;
  moderation_status?: ReviewModerationStatus;
  moderation_reason?: string | null;
  moderation_note?: string | null;
  garage_reply?: ReviewGarageReply | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  customer?: Pick<UserPublic, "id" | "full_name" | "avatar_url"> | null;
}

export interface ReviewSummary {
  rating_average: number;
  rating_count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason_code?: string | null;
  review?: GarageReview | null;
  context?: {
    booking_id: string;
    wash_history_id: string;
    garage_id: string;
    service_package_id: string;
  } | null;
}

export interface ReviewMutationPayload {
  garage_rating: number;
  service_rating: number;
  comment?: string | null;
  upload_ids: string[];
  is_anonymous: boolean;
}

export type CustomerCaseType =
  | "COMPLAINT"
  | "INCIDENT"
  | "HANDOVER_ISSUE"
  | "PAYMENT_ISSUE"
  | "OTHER"
  | string;

// BE status thực tế (theo customerCase.constant.js):
// SUBMITTED → ACKNOWLEDGED → INVESTIGATING → RESOLVED → CLOSED
export type CustomerCaseStatus =
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "CLOSED"
  | string;

export type CustomerCaseCategory =
  | "VEHICLE_DAMAGE"
  | "MISSING_PROPERTY"
  | "SERVICE_QUALITY"
  | "SERVICE_INCOMPLETE"
  | "BILLING_PAYMENT"
  | "STAFF_CONDUCT"
  | "SAFETY_CONCERN"
  | "OTHER"
  | string;

export type CustomerCasePriority = "NORMAL" | "HIGH" | "CRITICAL" | string;

export type CustomerCaseSource = "HANDOVER" | "AFTER_HANDOVER" | string;

export interface CustomerCaseUpload {
  id: string;
  url?: string;
  mime_type?: string;
  size?: number;
  purpose?: string;
  owner_id?: string | null;
  created_at?: string;
}

export interface CustomerCase {
  id: string;
  case_code?: string;
  booking_id?: string | null;
  handover_id?: string | null;
  garage_id?: string | null;
  customer_id?: string;
  customer?: {
    id: string;
    full_name?: string;
    role?: Role;
  } | null;
  vehicle_id?: string | null;
  is_walk_in_case?: boolean;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  created_by_staff_id?: string | null;
  category: CustomerCaseCategory;
  priority?: CustomerCasePriority;
  source?: CustomerCaseSource;
  status: CustomerCaseStatus;
  description?: string;
  damage_location?: string | null;
  desired_resolution?: string | null;
  discovered_at?: string | null;
  vehicle_received?: boolean;
  evidence?: CustomerCaseUpload[];
  assigned_to_id?: string | null;
  assigned_to?: {
    id: string;
    full_name?: string;
    role?: Role;
  } | null;
  assigned_by_id?: string | null;
  assigned_at?: string | null;
  acknowledged_by_id?: string | null;
  acknowledged_at?: string | null;
  first_response_due_at?: string | null;
  resolution_due_at?: string | null;
  first_response_breached_at?: string | null;
  resolution_breached_at?: string | null;
  escalation_level?: number;
  reopen_count?: number;
  last_reopened_at?: string | null;
  last_reopen_reason?: string | null;
  liability_status?:
    | "UNDETERMINED"
    | "GARAGE_RESPONSIBLE"
    | "PRE_EXISTING_DAMAGE"
    | "CUSTOMER_OR_THIRD_PARTY"
    | "INCONCLUSIVE"
    | string;
  conclusion?: string | null;
  resolution_summary?: string | null;
  resolved_by_id?: string | null;
  resolved_at?: string | null;
  closed_by_id?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at?: string;
  // Backward-compat field (alias of `category`) cho FE cũ dùng type
  type?: CustomerCaseCategory | string;
  subject?: string;
  attachments?: string[];
  resolution?: string | null;
}

export interface GarageWithDistance extends Garage {
  distance_km?: number | null;
  rating?: number | null;
  review_count?: number | null;
  total_bookings?: number | null;
  is_favorite?: boolean;
  photos?: string[];
  open_hours_text?: string | null;
}

// ===== Booking Handover =====
export type BookingHandoverState =
  | "PENDING"
  | "READY_FOR_CUSTOMER"
  | "ON_HOLD"
  | "RELEASED"
  | string;
export type BookingHandoverResponse =
  | "PENDING"
  | "ACCEPTED"
  | "ISSUE_REPORTED"
  | string;
export type BookingHandoverResponseSource =
  | "CUSTOMER_SELF_SERVICE"
  | "STAFF_ASSISTED"
  | string;

export interface BookingHandoverInspectionImage {
  id?: string;
  type?: "BEFORE_WASH" | "AFTER_WASH" | string;
  url?: string;
  thumbnail_url?: string;
  note?: string | null;
  uploaded_at?: string;
}

export interface BookingHandoverInspectionSnapshot {
  before?: {
    id: string;
    type: "BEFORE_WASH" | string;
    note?: string | null;
    images: string[];
    inspected_by_id?: string | null;
    inspected_at?: string | null;
  } | null;
  after?: {
    id: string;
    type: "AFTER_WASH" | string;
    note?: string | null;
    images: string[];
    inspected_by_id?: string | null;
    inspected_at?: string | null;
  } | null;
}

export interface BookingHandoverUserSummary {
  id: string;
  full_name?: string | null;
  role?: Role;
}

export interface BookingHandover {
  id: string;
  booking_id: string;
  garage_id: string;
  customer_id?: string | null;
  vehicle_id?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  state: BookingHandoverState;
  customer_response: BookingHandoverResponse;
  customer_response_source?: BookingHandoverResponseSource | null;
  ready_at?: string | null;
  ready_by_id?: string | null;
  ready_by?: BookingHandoverUserSummary | null;
  ready_note?: string | null;
  customer_responded_at?: string | null;
  customer_response_recorded_by_id?: string | null;
  customer_response_recorded_by?: BookingHandoverUserSummary | null;
  customer_response_note?: string | null;
  accepted_at?: string | null;
  released_at?: string | null;
  released_by_id?: string | null;
  released_by?: BookingHandoverUserSummary | null;
  release_note?: string | null;
  issue_case_ids?: string[];
  inspection_snapshot?: BookingHandoverInspectionSnapshot | Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ===== Booking Incident =====
export type BookingIncidentType =
  | "WASH_BAY_FAILURE"
  | "STAFF_UNAVAILABLE"
  | "OTHER_GARAGE_INCIDENT"
  | string;
export type BookingIncidentStatus =
  | "AWAITING_CUSTOMER_DECISION"
  | "RESOLVED"
  | "VOIDED"
  | string;
export type BookingIncidentDecision =
  | "REASSIGN_AND_CONTINUE"
  | "RESCHEDULE_NEAREST"
  | "RESCHEDULE_CUSTOM"
  | "CANCEL_BY_GARAGE"
  | string;
export type BookingIncidentContinuationPolicy =
  | "RESUME_REMAINING"
  | "RESTART_CURRENT_ITEM"
  | string;

export interface BookingIncident {
  id: string;
  booking_id: string;
  garage_id?: string | null;
  customer_id?: string | null;
  incident_type: BookingIncidentType;
  description?: string | null;
  status: BookingIncidentStatus;
  affected_booking_item_key?: string | null;
  affected_wash_bay_id?: string | null;
  affected_staff_profile_id?: string | null;
  reported_by_id?: string | null;
  reported_by?: BookingHandoverUserSummary | null;
  reported_booking_status?: BookingStatus;
  reported_schedule_snapshot?: Record<string, unknown>;
  countdown_paused_automatically?: boolean;
  decision?: BookingIncidentDecision | null;
  decision_source?: "CUSTOMER" | "STAFF_RECORDED" | string;
  contact_channel?: "APP" | "PHONE" | "IN_PERSON" | string;
  customer_note?: string | null;
  new_start_time?: string | null;
  continuation_policy?: BookingIncidentContinuationPolicy | null;
  customer_confirmed_at?: string | null;
  decision_recorded_by_id?: string | null;
  decision_recorded_by?: BookingHandoverUserSummary | null;
  resolved_at?: string | null;
  resolved_by_id?: string | null;
  resolved_by?: BookingHandoverUserSummary | null;
  compensation_voucher_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface IncidentResolutionDay {
  date: string;
  suggested_slots: Array<{
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }>;
  has_available_slots?: boolean;
  reason?: string | null;
}

export interface IncidentResolutionOptions {
  booking_id: string;
  incident_id: string;
  incident_type: BookingIncidentType;
  operation_status?: BookingOperationStatus;
  can_reassign_and_continue?: boolean;
  available_actions: BookingIncidentDecision[];
  search_start_time?: string;
  days?: IncidentResolutionDay[];
  suggested_slots?: Array<{
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }>;
}

export interface BookingIncidentActiveResponse {
  incident: BookingIncident | null;
  resolution_options: IncidentResolutionOptions | null;
}

// ===== Customer Case extended =====
export type CustomerCaseLiabilityStatus =
  | "UNDETERMINED"
  | "GARAGE_AT_FAULT"
  | "CUSTOMER_AT_FAULT"
  | "SHARED"
  | "NO_LIABILITY"
  | string;

export interface CustomerCaseMessage {
  id: string;
  case_id: string;
  sender_id?: string | null;
  sender?: {
    id: string;
    full_name?: string;
    role?: Role;
  } | null;
  sender_role: "CUSTOMER" | "STAFF" | "ADMIN" | string;
  message: string;
  evidence?: CustomerCaseUpload[];
  created_at: string;
}

export interface CustomerCaseEvent {
  id: string;
  case_id: string;
  event_type: string;
  actor_id?: string | null;
  actor?: {
    id: string;
    full_name?: string;
    role?: Role;
  } | null;
  actor_role?: string;
  from_status?: string;
  to_status?: string;
  visible_to_customer?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CustomerCaseTechnicalAssessment {
  id: string;
  case_id: string;
  garage_id: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | string;
  findings?: string;
  root_cause?: string;
  severity?: "MINOR" | "MODERATE" | "MAJOR" | "SAFETY_CRITICAL" | string;
  recommended_resolution?: string;
  evidence?: CustomerCaseUpload[];
  created_at?: string;
  updated_at?: string;
}

export interface CustomerCaseResolutionAction {
  id?: string;
  action_type:
    | "REFUND"
    | "VOUCHER"
    | "REWORK"
    | "WAIVE_CHARGE"
    | "NO_COMPENSATION"
    | string;
  amount?: number | null;
  refund_method?: "ORIGINAL_PAYMENT" | "CASH" | "BANK_TRANSFER" | string;
  voucher_type?: string;
  value?: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  service_package_id?: string | null;
  expires_at?: string;
  rework_start_time?: string;
  voucher_id?: string;
  note?: string;
}

export interface CustomerCaseResolution {
  id: string;
  case_id: string;
  version: number;
  summary: string;
  actions: CustomerCaseResolutionAction[];
  status:
    | "PROPOSED"
    | "CUSTOMER_ACCEPTED"
    | "CUSTOMER_REJECTED"
    | "APPLIED"
    | "FAILED"
    | "SUPERSEDED"
    | string;
  proposed_by_id?: string | null;
  proposed_at?: string;
  customer_responded_by_id?: string | null;
  customer_responded_at?: string | null;
  customer_response_note?: string | null;
  applied_at?: string | null;
  applied_by_id?: string | null;
  refund_ids?: string[];
  voucher_ids?: string[];
  rework_booking_ids?: string[];
}

export interface CustomerCaseRefund {
  id: string;
  case_id: string;
  resolution_id?: string | null;
  booking_id?: string | null;
  amount: number;
  currency?: string;
  method: "ORIGINAL_PAYMENT" | "CASH" | "BANK_TRANSFER" | string;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | string;
  transaction_reference?: string | null;
  failure_reason?: string | null;
  note?: string | null;
  approved_by_id?: string | null;
  processed_by_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerCaseDetailResponse {
  case: CustomerCase;
  messages: CustomerCaseMessage[];
  timeline: CustomerCaseEvent[];
  technical_assessment: CustomerCaseTechnicalAssessment | null;
  resolutions: CustomerCaseResolution[];
  refunds: CustomerCaseRefund[];
}
