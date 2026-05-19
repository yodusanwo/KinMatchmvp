import type { PublicPlanPoll } from "@/lib/plans/types";

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildPlanIcs(poll: PublicPlanPoll): string | null {
  if (!poll.selected_option) return null;
  const option = poll.options.find((item) => item.index === poll.selected_option);
  if (!option) return null;

  const start = new Date(option.datetime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = `Plan with ${poll.sender_name}`;
  const description = poll.message
    ? `${poll.sender_name}: ${poll.message}`
    : `Plan through KinMatch with ${poll.sender_name}.`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KinMatch//Plan Poll//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${poll.poll_token}@kinmatch`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(start.toISOString())}`,
    `DTEND:${toIcsDate(end.toISOString())}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
