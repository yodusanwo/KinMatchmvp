"use client";

import { useMemo } from "react";
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
    const n = tribe.length;
    const ringRadius = n <= 6 ? 120 : n <= 10 ? 132 : 140;
    const nodeR = n <= 6 ? 25 : n <= 12 ? 19 : 14;
    const hubR = nodeR + 7;
    const showLabels = n <= 7; // hide labels past 7 to avoid collisions

    const ring: RingNode[] = tribe.map((friend, i) => {
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

    return { cx, cy, ring, ringRadius, nodeR, hubR, showLabels };
  }, [tribe, highlightFriendId]);

  if (tribe.length === 0) {
    return (
      <p className="font-sans text-sm italic text-slate">
        Add your first connection to begin.
      </p>
    );
  }

  const { cx, cy, ring, ringRadius, nodeR, hubR, showLabels } = layout;

  function open(id: string) {
    router.push(`/friends/${id}`);
  }

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      role="img"
      aria-label={`Your tribe of ${tribe.length} ${tribe.length === 1 ? "person" : "people"}`}
      className={cn("mx-auto block max-w-[360px] font-sans", className)}
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
            stroke={p.quiet ? "#ff880b" : p.highlight ? "#21242e" : "none"}
            strokeWidth={p.quiet ? 3 : p.highlight ? 2 : 0}
          />
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
  );
}
