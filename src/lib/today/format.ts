export function dayEyebrow(date = new Date()): string {
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  const hour = date.getHours();
  const period =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `${day} ${period}`;
}

export function todayDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
