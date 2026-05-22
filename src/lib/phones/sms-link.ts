export function buildSmsLink(phone: string, body: string): string {
  const encodedBody = encodeURIComponent(body);
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? "?&body=" : "?body=";
  const normalizedPhone = phone.replace(/\s+/g, "");
  return `sms:${normalizedPhone}${separator}${encodedBody}`;
}
