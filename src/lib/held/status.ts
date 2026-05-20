export function heldQuietStatus(
  daysQuiet: number,
  thresholdDays: number,
  atThreshold: boolean
): string {
  if (atThreshold) {
    return `${daysQuiet}d quiet · notify now`;
  }
  return `${daysQuiet}d quiet · quiet window ${thresholdDays}d`;
}

export function formatHeldEventType(type: string): string {
  const labels: Record<string, string> = {
    alert_fired: "Quiet alert sent",
    response_received: "They reached out",
    paused: "Held paused",
    threshold_changed: "Threshold updated",
  };
  return labels[type] ?? type.replace(/_/g, " ");
}
