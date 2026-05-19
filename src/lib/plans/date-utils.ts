export function nextWeekdayEvenings(count = 3): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);

  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const option = new Date(cursor);
      option.setHours(19, 0, 0, 0);
      dates.push(option);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function toDateInputValue(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function toTimeInputValue(date: Date): string {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");
}

export function combineLocalDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const combined = new Date(`${date}T${time}`);
  if (Number.isNaN(combined.getTime())) return null;
  return combined.toISOString();
}

export function formatPlanOption(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
