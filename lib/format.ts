export function formatCurrency(
  value?: number | null | string,
  options: { compact?: boolean; showSymbol?: boolean } = {}
) {
  const { compact = false, showSymbol = true } = options;
  const raw = typeof value === "number" ? value : Number(value ?? 0);
  const amount =
    typeof raw === "number" && Number.isFinite(raw) ? raw : 0;

  if (compact && Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions.toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    });
    return showSymbol ? `${formatted}tr` : formatted;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    const thousands = amount / 1_000;
    const formatted = thousands.toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    });
    return showSymbol ? `${formatted}k` : formatted;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeRange(startIso?: string, endIso?: string) {
  if (!startIso) return "";
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;

  const startText = start.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end || Number.isNaN(end.getTime())) {
    return startText;
  }

  const endText = end.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startText} - ${endText}`;
}

export function formatDuration(minutes?: number | null) {
  if (!minutes || !Number.isFinite(minutes)) return "";
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours}h ${mins}p`;
  if (hours) return `${hours}h`;
  return `${mins}p`;
}

export function formatDateLabel(isoDate: string) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function formatDateTimeLong(isoDate: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function minutesUntil(isoDate: string) {
  const delta = new Date(isoDate).getTime() - Date.now();
  return Math.max(0, Math.round(delta / 60000));
}

export function formatRemaining(isoDate: string | null | undefined) {
  if (!isoDate) return "";
  const delta = new Date(isoDate).getTime() - Date.now();
  const totalSec = Math.max(0, Math.round(delta / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}h ${mins}p`;
  if (mins > 0) return `${mins}p ${secs}s`;
  return `${secs}s`;
}

export function formatLicensePlate(plate: string) {
  const value = plate.trim();
  if (!value) {
    return { top: "--", bottom: "--" };
  }

  const cleaned = value.replace(/\s+/g, "");
  const parts = cleaned.split("-");

  if (parts.length === 2) {
    return { top: parts[0], bottom: parts[1] };
  }

  if (cleaned.length > 4) {
    return {
      top: cleaned.slice(0, Math.min(4, cleaned.length - 4)),
      bottom: cleaned.slice(-4),
    };
  }

  return { top: cleaned, bottom: "" };
}

export function compactName(fullName?: string | null, fallback = "Khách") {
  if (!fullName) {
    return fallback;
  }

  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || fallback;
}
