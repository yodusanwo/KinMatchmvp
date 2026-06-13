"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FriendSummary } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDisplayName } from "@/lib/names/format";
import {
  getAvatarTextColor,
  resolveFriendColor,
  resolveInitials,
} from "@/lib/friends/avatar-colors";

type TribeCircleGraphicProps = {
  tribe: FriendSummary[];
  highlightFriendId?: string;
  className?: string;
};

const SIZE = 360;
// Above this many in the ring, initials get tight — so we constellation only
// the most relevant inner ring and link out to the full tribe list.
const MAX_RING = 14;

// Surface whoever needs attention first: drifting, then longest quiet.
function byPriority(a: FriendSummary, b: FriendSummary) {
  return Number(b.is_drifting) - Number(a.is_drifting) || b.days_quiet - a.days_quiet;
}

type RingNode = {
  friend: FriendSummary;
  id: string;
  name: string;
  initials: string;
  color: string;
  textColor: string;
  quietLabel: string;
  ariaLabel: string;
  quiet: boolean;
  highlight: boolean;
  x: number;
  y: number;
};

function quietLabel(friend: FriendSummary) {
  if (!friend.last_touch_at) return "not yet";
  return friend.days_quiet === 0 ? "today" : `${friend.days_quiet}d quiet`;
}

function quietAria(friend: FriendSummary) {
  if (!friend.last_touch_at) return "not contacted yet";
  if (friend.days_quiet === 0) return "reached out today";
  return `${friend.days_quiet} ${friend.days_quiet === 1 ? "day" : "days"} quiet`;
}

export function TribeCircleGraphic({
  tribe,
  highlightFriendId,
  className,
}: TribeCircleGraphicProps) {
  const router = useRouter();

  const layout = useMemo(() => {
    const cx = SIZE / 2;
    const cy = SIZE / 2 - 8;

    // Once the tribe is big, only the inner ring orbits the hub; the rest
    // live one tap away under "show all".
    const overflow = tribe.length > MAX_RING ? tribe.length - MAX_RING : 0;
    const members =
      overflow > 0 ? [...tribe].sort(byPriority).slice(0, MAX_RING) : tribe;

    const n = members.length;
    const ringRadius = n <= 6 ? 120 : n <= 10 ? 132 : 140;
    const nodeR = n <= 6 ? 25 : n <= 12 ? 19 : 14;
    const hubR = nodeR + 7;
    const showLabels = n <= 7; // hide labels past 7 to avoid collisions

    const ring: RingNode[] = members.map((friend, i) => {
      const a = ((-90 + (360 / n) * i) * Math.PI) / 180; // start at top, clockwise
      const color = resolveFriendColor(friend.name, friend.avatar_color_hex);
      return {
        friend,
        id: friend.id,
        name: formatDisplayName(friend.name),
        initials: resolveInitials(friend.name, friend.avatar_initials),
        color,
        textColor: getAvatarTextColor(color),
        quietLabel: quietLabel(friend),
        ariaLabel: `${formatDisplayName(friend.name)}, ${quietAria(friend)}`,
        quiet: friend.is_drifting,
        highlight: friend.id === highlightFriendId,
        x: cx + ringRadius * Math.cos(a),
        y: cy + ringRadius * Math.sin(a),
      };
    });

    return { cx, cy, ring, ringRadius, nodeR, hubR, showLabels, overflow };
  }, [tribe, highlightFriendId]);

  if (tribe.length === 0) {
    return (
      <p className="font-sans text-sm italic text-slate">
        Add your first connection to begin.
      </p>
    );
  }

  const { cx, cy, ring, ringRadius, nodeR, hubR, showLabels, overflow } = layout;
  const hasToday = ring.some((p) => p.highlight);
  const hasQuiet = ring.some((p) => p.quiet);

  function open(id: string) {
    router.push(`/friends/${id}`);
  }

  return (
    <div className={cn("mx-auto w-full max-w-[360px]", className)}>
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      role="img"
      aria-label={`Your tribe of ${tribe.length} ${tribe.length === 1 ? "person" : "people"}`}
      className="block font-sans"
    >
      <rect x="2" y="2" width={SIZE - 4} height={SIZE - 4} rx="20" fill="#e7eafb" />

      {/* faint dashed orbit */}
      <circle
        cx={cx}
        cy={cy}
        r={ringRadius}
        fill="none"
        stroke="#b9c1e8"
        strokeWidth="1.5"
        strokeDasharray="3 6"
      />

      {/* connector lines from each member to the hub */}
      <g stroke="#aeb5dc" strokeWidth="1.5">
        {ring.map((p) => (
          <line key={`l-${p.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} />
        ))}
      </g>

      {/* member nodes */}
      {ring.map((p) => (
        <g
          key={p.id}
          role="button"
          tabIndex={0}
          aria-label={p.ariaLabel}
          className="cursor-pointer outline-none [outline-offset:3px] focus-visible:[outline:2px_solid_#ff880b]"
          onClick={() => open(p.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              open(p.id);
            }
          }}
        >
          <title>{`${p.name} — ${p.quietLabel}`}</title>
          <circle
            cx={p.x}
            cy={p.y}
            r={nodeR}
            fill={p.color}
            stroke={p.quiet ? "#ff880b" : "none"}
            strokeWidth={p.quiet ? 3 : 0}
          />
          {p.highlight && (
            <circle
              cx={p.x}
              cy={p.y}
              r={nodeR + 4.5}
              fill="none"
              stroke="#21242e"
              strokeWidth={2.5}
            />
          )}
          <text
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={p.textColor}
            fontSize={13}
            fontWeight="700"
          >
            {p.initials}
          </text>
          {showLabels && (
            <>
              <text
                x={p.x}
                y={p.y + nodeR + 16}
                textAnchor="middle"
                fill="#20242f"
                fontSize="12.5"
                fontWeight="600"
              >
                {p.name}
              </text>
              <text
                x={p.x}
                y={p.y + nodeR + 30}
                textAnchor="middle"
                fill="#6b7088"
                fontSize="10"
              >
                {p.quietLabel}
              </text>
            </>
          )}
        </g>
      ))}

      {/* center hub = you */}
      <g aria-hidden>
        <circle cx={cx} cy={cy} r={hubR} fill="#21242e" />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={13}
          fontWeight="700"
        >
          You
        </text>
      </g>
    </svg>

      {(hasToday || hasQuiet) && (
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          {hasToday && (
            <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-slate">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-[2.5px] border-carbon"
                aria-hidden
              />
              today&apos;s nudge
            </span>
          )}
          {hasQuiet && (
            <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-slate">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-terracotta"
                aria-hidden
              />
              gone quiet
            </span>
          )}
        </div>
      )}

      {overflow > 0 && (
        <div className="mt-2 text-center">
          <Link
            href="/tribe"
            className="inline-flex min-h-[44px] items-center justify-center font-sans text-[13px] font-semibold text-burnt-orange underline decoration-burnt-orange/40 underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          >
            Show all {tribe.length} →
          </Link>
        </div>
      )}
    </div>
  );
}
