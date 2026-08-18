const PAD = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` for a Date's LOCAL calendar day — matches native `<input type="date">`'s value format. */
export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;
}

/** `HH:MM` for a Date's LOCAL time-of-day — matches native `<input type="time">`'s value format. */
export function formatLocalTime(date: Date): string {
  return `${PAD(date.getHours())}:${PAD(date.getMinutes())}`;
}

/** Today, in the browser's local timezone — used as the earliest selectable scheduling date. */
export function getTodayDateString(now: Date = new Date()): string {
  return formatLocalDate(now);
}

/**
 * BOOKING-UX-01 — the default slot a "book now" passenger is really booking
 * for: roughly 5 minutes from now, rounded up to a clean 5-minute mark (e.g.
 * 08:22 -> 08:30, 08:27 -> 08:35) so the driver has a moment to receive and
 * accept the request. Built on real `Date` arithmetic so an end-of-day
 * buffer (e.g. 23:57 -> 00:05) rolls the date forward automatically — never
 * a hardcoded time, always computed from `now`.
 */
export function getDefaultScheduleSlot(now: Date = new Date()): { date: string; time: string } {
  const withBuffer = new Date(now.getTime() + 5 * 60 * 1000);
  const roundedMinutes = Math.ceil(withBuffer.getMinutes() / 5) * 5;
  withBuffer.setMinutes(roundedMinutes, 0, 0);
  return { date: formatLocalDate(withBuffer), time: formatLocalTime(withBuffer) };
}
