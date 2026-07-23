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
  created_at: string;
}

export interface WashHistory {
  id: string;
  booking_id: string;
  amount_paid: number;
  discount_amount: number;
  points_earned: number;
  points_used: number;
  payment_method?: string;
  paid_at?: string;
  service_completed_at?: string;
  booking?: Pick<Booking, "id" | "start_time" | "status" | "payment_status"> | null;
  garage?: Garage | null;
  vehicle?: Vehicle | null;
  service_package?: ServicePackage | null;
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
  status: "WAITING" | "OFFERED" | "ACCEPTED" | "CANCELED" | "EXPIRED" | string;
  offered_at?: string | null;
  offer_expires_at?: string | null;
  accepted_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  expired_at?: string | null;
  created_booking_id?: string | null;
  note?: string | null;
  garage?: Garage | null;
  vehicle?: Vehicle | null;
  service_package?: ServicePackage | null;
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
