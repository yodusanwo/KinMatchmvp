type SafariPermissionMockProps = {
  highlightAllow?: boolean;
  className?: string;
};

export function SafariPermissionMock({
  highlightAllow = true,
  className = "",
}: SafariPermissionMockProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl bg-[#f2f2f7]/95 text-center shadow-lg ring-1 ring-ink/10 ${className}`}
      aria-hidden="true"
    >
      <div className="px-5 pb-3 pt-5">
        <p className="font-sans text-[15px] font-semibold leading-snug text-[#1c1c1e]">
          &ldquo;kin-matchmvp.vercel.app&rdquo; Would Like to Access the
          Microphone
        </p>
        <p className="mt-2 font-sans text-[13px] leading-snug text-[#3c3c43]/80">
          KinMatch only uses your microphone when you record a voice note.
        </p>
      </div>
      <div className="grid grid-cols-2 border-t border-[#c6c6c8]">
        <div className="border-r border-[#c6c6c8] py-3 font-sans text-[17px] text-[#007aff]">
          Don&apos;t Allow
        </div>
        <div
          className={`py-3 font-sans text-[17px] font-semibold text-[#007aff] ${
            highlightAllow ? "bg-[#007aff]/10" : ""
          }`}
        >
          Allow
        </div>
      </div>
    </div>
  );
}
