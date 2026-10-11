export const EVENT_TIME_ZONE = "Asia/Kolkata";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// ₹1,50,000 (Indian digit grouping); 0 reads as "Free".
export function formatPrice(price: number) {
  return price === 0 ? "Free" : rupees.format(price);
}

const dateParts = new Intl.DateTimeFormat("en-IN", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// Fixed names: en-IN shortens September to "Sept", which breaks the 3-letter pattern.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Sat, 18 Oct, 6:30 PM" in IST, whatever the viewer's time zone.
export function formatEventDate(value: string | Date) {
  const parts = Object.fromEntries(
    dateParts.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );
  const month = MONTHS[Number(parts.month) - 1];
  return `${parts.weekday}, ${Number(parts.day)} ${month}, ${parts.hour}:${parts.minute} ${parts.dayPeriod?.toUpperCase()}`;
}
