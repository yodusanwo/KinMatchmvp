"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import {
  BrandBar,
  Eyebrow,
  Headline,
  PrimaryButton,
  Subhead,
  TextLink,
} from "@/components/brand";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/nav/BottomNav";
import { FriendContactInfoSection } from "@/components/profile/FriendContactInfoSection";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import {
  hasGetUserMedia,
  iosSafariUnlockSteps,
  isIOS,
  requestMicAccess,
} from "@/lib/audio/mic-permission";

type EmailPreferences = {
  daily_checkin_enabled: boolean;
  sunday_voice_drop_enabled: boolean;
  held_alerts_enabled: boolean;
};

type ProfileScreenProps = {
  email: string;
  name: string | null;
  onboardingComplete: boolean;
  emailPreferences: EmailPreferences | null;
};

type PreferenceField = keyof EmailPreferences;

type MicStatusLocal =
  | "idle"
  | "requesting"
  | "ready"
  | "blocked"
  | "unsupported";

const PREFERENCES: {
  field: PreferenceField;
  label: string;
  helper: string;
}[] = [
  {
    field: "daily_checkin_enabled",
    label: "Daily check-in",
    helper: "A name from your tribe and a reason to reach out.",
  },
  {
    field: "sunday_voice_drop_enabled",
    label: "Sunday voice drop",
    helper: "A weekly suggested voice note to send.",
  },
  {
    field: "held_alerts_enabled",
    label: "Held alerts",
    helper: "Soft reminders to your holders when you go quiet.",
  },
];

const mutedHelperClassName =
  "font-inter text-[11px] italic leading-relaxed text-[rgba(31,26,20,0.5)]";

function ToggleSwitch({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-[26px] w-11 shrink-0 rounded-[13px] transition-colors duration-200 ease-in-out",
        checked ? "bg-terracotta" : "bg-ink/[0.15]"
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </span>
  );
}

export function ProfileScreen({
  email,
  name,
  onboardingComplete,
  emailPreferences,
}: ProfileScreenProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [localName, setLocalName] = useState(name?.trim() ?? "");
  const [savedName, setSavedName] = useState(name?.trim() ?? "");
  const [editingName, setEditingName] = useState(!name?.trim());
  const [nameMessage, setNameMessage] = useState<{
    kind: "saved" | "error";
    text: string;
  } | null>(null);
  const [localPrefs, setLocalPrefs] = useState<EmailPreferences>({
    daily_checkin_enabled: emailPreferences?.daily_checkin_enabled ?? true,
    sunday_voice_drop_enabled:
      emailPreferences?.sunday_voice_drop_enabled ?? true,
    held_alerts_enabled: emailPreferences?.held_alerts_enabled ?? true,
  });
  const [prefError, setPrefError] = useState<string | null>(null);
  const [contactNotice, setContactNotice] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatusLocal>("idle");
  const [micMessage, setMicMessage] = useState<string | null>(null);
  const nameMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const prefErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    async function loadCurrentProfile() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data } = await supabase
        .from("users")
        .select(
          "name, daily_checkin_enabled, sunday_voice_drop_enabled, held_alerts_enabled"
        )
        .eq("id", authUser.id)
        .single();

      if (!data) return;
      const nextName = data.name?.trim() ?? "";
      setLocalName(nextName);
      setSavedName(nextName);
      setEditingName(!nextName);
      setLocalPrefs({
        daily_checkin_enabled: data.daily_checkin_enabled ?? true,
        sunday_voice_drop_enabled: data.sunday_voice_drop_enabled ?? true,
        held_alerts_enabled: data.held_alerts_enabled ?? true,
      });
    }

    void loadCurrentProfile();

    return () => {
      if (nameMessageTimeoutRef.current) {
        clearTimeout(nameMessageTimeoutRef.current);
      }
      if (prefErrorTimeoutRef.current) {
        clearTimeout(prefErrorTimeoutRef.current);
      }
    };
  }, []);

  function showNameMessage(kind: "saved" | "error", text: string) {
    if (nameMessageTimeoutRef.current) {
      clearTimeout(nameMessageTimeoutRef.current);
    }
    setNameMessage({ kind, text });
    nameMessageTimeoutRef.current = setTimeout(
      () => setNameMessage(null),
      kind === "saved" ? 1500 : 3000
    );
  }

  function showPreferenceError() {
    if (prefErrorTimeoutRef.current) {
      clearTimeout(prefErrorTimeoutRef.current);
    }
    setPrefError("Couldn't save — try again");
    prefErrorTimeoutRef.current = setTimeout(() => setPrefError(null), 3000);
  }

  function showContactNotice(message: string) {
    setContactNotice(message);
    window.setTimeout(() => setContactNotice(null), 3000);
  }

  async function saveName() {
    const nextName = localName.trim();
    if (nextName === savedName) {
      setEditingName(!nextName);
      return;
    }

    const previousName = savedName;
    const response = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName || null }),
    });

    if (!response.ok) {
      setLocalName(previousName);
      setEditingName(!previousName);
      showNameMessage("error", "couldn't save — try again");
      return;
    }

    setSavedName(nextName);
    setLocalName(nextName);
    setEditingName(!nextName);
    showNameMessage("saved", "saved");
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setLocalName(savedName);
      setEditingName(!savedName);
    }
  }

  async function handleToggle(field: PreferenceField, newValue: boolean) {
    setLocalPrefs((current) => ({ ...current, [field]: newValue }));

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });

      if (!response.ok) throw new Error("Save failed");
    } catch {
      setLocalPrefs((current) => ({ ...current, [field]: !newValue }));
      showPreferenceError();
    }
  }

  async function requestMicrophone() {
    setMicMessage(null);

    if (!hasGetUserMedia()) {
      setMicStatus("unsupported");
      setMicMessage(
        "This browser can't set up voice notes here. You can still continue."
      );
      return false;
    }

    setMicStatus("requesting");

    const result = await requestMicAccess();
    if (result.ok) {
      result.stream.getTracks().forEach((track) => track.stop());
      setMicStatus("ready");
      setMicMessage("Voice notes are ready.");
      return true;
    }

    setMicStatus(
      result.error.kind === "unsupported" ? "unsupported" : "blocked"
    );
    setMicMessage(result.error.message);
    return false;
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <AppShell>
      <BrandBar />
      <div className="flex min-h-screen flex-col px-5 pb-28 pt-6">
        <Eyebrow>your account</Eyebrow>
        <Headline className="mt-2">{savedName || "Profile"}</Headline>
        <Subhead className="mt-2">{email}</Subhead>

        <dl className="mt-8 space-y-4 rounded-2xl border border-ink/[0.12] bg-cream-deep/60 p-5">
          <div
            className={cn(
              "flex items-start justify-between gap-4",
              editingName && "border-b border-ink/[0.2]"
            )}
          >
            <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Name
            </dt>
            <dd className="min-w-0 flex-1 text-right">
              {editingName ? (
                <input
                  value={localName}
                  onChange={(event) => setLocalName(event.target.value)}
                  onBlur={() => void saveName()}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Add your name"
                  autoFocus
                  className="w-full bg-cream text-right font-inter text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="inline-flex items-center justify-end gap-2 font-inter text-sm text-ink"
                >
                  <span>{savedName}</span>
                  <Pencil className="h-3.5 w-3.5 text-ink-soft" aria-hidden />
                </button>
              )}
              {nameMessage && (
                <p
                  className={cn(
                    "mt-1 font-inter text-[11px] italic",
                    nameMessage.kind === "saved"
                      ? "text-[rgba(31,26,20,0.5)]"
                      : "text-terracotta"
                  )}
                >
                  {nameMessage.text}
                </p>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Email
            </dt>
            <dd className="text-right">
              <p className="font-inter text-sm text-ink">{email}</p>
              <p className={`mt-1 ${mutedHelperClassName}`}>
                Your sign-in email. Contact us to change.
              </p>
            </dd>
          </div>
          {onboardingComplete && (
            <>
              <div className="border-t border-ink/[0.08] pt-4">
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                  email preferences
                </p>
                {prefError && (
                  <p className="mt-1 font-inter text-[11px] italic text-terracotta">
                    {prefError}
                  </p>
                )}
              </div>
              {PREFERENCES.map((preference) => {
                const checked = localPrefs[preference.field];
                return (
                  <button
                    key={preference.field}
                    type="button"
                    onClick={() => void handleToggle(preference.field, !checked)}
                    className="flex min-h-11 w-full items-center justify-between gap-4 text-left"
                    aria-pressed={checked}
                  >
                    <span>
                      <span className="block font-inter text-sm text-ink">
                        {preference.label}
                      </span>
                      <span className={`mt-1 block ${mutedHelperClassName}`}>
                        {preference.helper}
                      </span>
                    </span>
                    <ToggleSwitch checked={checked} />
                  </button>
                );
              })}

              <div className="border-t border-ink/[0.08] pt-4">
                <p className="font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                  voice notes
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-inter text-sm font-medium text-ink">
                  Set up voice notes
                </h3>
                <p className={mutedHelperClassName}>
                  We&apos;ll ask for mic access so you can record voice notes for
                  your people.
                </p>

                {micStatus === "ready" && micMessage && (
                  <div className="rounded-xl bg-cream-deep/45 p-3">
                    <p className="font-inter text-sm text-[#2D5016]">
                      {micMessage}
                    </p>
                  </div>
                )}

                {(micStatus === "blocked" || micStatus === "unsupported") &&
                  micMessage && (
                    <div className="space-y-3 rounded-xl border border-terracotta/20 bg-terracotta/[0.03] p-4">
                      <p className="font-inter text-sm text-terracotta">
                        {micMessage}
                      </p>
                      {micStatus === "blocked" && (
                        <div className="space-y-2 rounded-xl bg-cream p-4">
                          <p className="font-inter text-[13px] font-medium text-ink">
                            {isIOS()
                              ? "To enable the mic:"
                              : "To fix this:"}
                          </p>
                          {isIOS() ? (
                            <ol className="ml-4 list-decimal space-y-1 font-inter text-[13px] text-ink">
                              {iosSafariUnlockSteps().map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          ) : (
                            <p className="font-inter text-[13px] text-ink">
                              Open your browser's site settings and allow
                              microphone access for this site.
                            </p>
                          )}
                          <p className={`mt-2 ${mutedHelperClassName}`}>
                            Or skip — you can text your people instead.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                <PrimaryButton
                  type="button"
                  onClick={() => void requestMicrophone()}
                  disabled={micStatus === "requesting"}
                >
                  {micStatus === "requesting"
                    ? "Requesting access…"
                    : micStatus === "blocked"
                      ? "Try again →"
                      : "Set up voice notes →"}
                </PrimaryButton>
              </div>
            </>
          )}
        </dl>

        {onboardingComplete && (
          <>
            <FriendContactInfoSection onToast={showContactNotice} />
            {contactNotice && (
              <p className="mt-2 font-inter text-sm italic text-ink-soft">
                {contactNotice}
              </p>
            )}
          </>
        )}

        <p className="mt-6 font-inter text-sm text-ink-soft">
          You sign in with a magic link — no password. Use the button below to
          switch accounts on this device.{" "}
          <TextLink href="/privacy">Privacy</TextLink>
        </p>

        <div className="mt-8 space-y-4">
          {onboardingComplete && (
            <p className="text-center">
              <TextLink href="/today">← Back to Today</TextLink>
            </p>
          )}
          <PrimaryButton
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </PrimaryButton>
        </div>
      </div>
      {onboardingComplete && <BottomNav />}
    </AppShell>
  );
}
