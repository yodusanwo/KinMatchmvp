export function interactionLabel(type: string): string {
  const labels: Record<string, string> = {
    voice_note_sent: "Voice note sent",
    voice_note_received: "Voice note received",
    call: "Phone call",
    in_person: "In person",
    text: "Text message",
  };
  return labels[type] ?? type.replace(/_/g, " ");
}

export function ritualCadenceLabel(cadence: string): string {
  const labels: Record<string, string> = {
    weekly: "Weekly",
    biweekly: "Biweekly",
    monthly: "Monthly",
  };
  return labels[cadence] ?? cadence;
}
