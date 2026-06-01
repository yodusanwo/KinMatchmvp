"""
tools.py — Tool implementations for the KinMatch Relational Care Agent.

Each function corresponds to a tool the agent can call. In this demo version,
tools read from fake_data.py. In production (Day 3), these will be replaced
with real Supabase queries.

The tool signatures and return shapes will NOT change between demo and
production — that's the whole point of building the stubs first.
"""

from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

from fake_data import get_active_scenario


# ============================================================
# Group A: Read tools
# ============================================================

def get_user_profile(user_id: str) -> dict:
    """Return the user's name, held relationships, and preferences."""
    print(f"  [tool] get_user_profile(user_id={user_id})")
    scenario = get_active_scenario()
    user = scenario["user"]
    return {
        "user_id": user["user_id"],
        "first_name": user["first_name"],
        "email": user["email"],
        "held_relationships": user["held_relationships"],
        "onboarded_at": user["onboarded_at"],
        "preferences": user["preferences"],
    }


def get_user_tribe(user_id: str) -> dict:
    """Return all friends with rhythm data AND the notes the user wrote."""
    print(f"  [tool] get_user_tribe(user_id={user_id})")
    scenario = get_active_scenario()
    friends = list(scenario["friends"].values())
    return {
        "friends": friends,
        "count": len(friends),
        "inner_circle_count": sum(1 for f in friends if f["category"] == "inner_circle"),
        "village_count": sum(1 for f in friends if f["category"] == "village"),
        "acquaintance_count": sum(1 for f in friends if f["category"] == "acquaintance"),
    }


def get_user_rituals(user_id: str) -> dict:
    """Return active rituals with names, participants, and overdue status."""
    print(f"  [tool] get_user_rituals(user_id={user_id})")
    scenario = get_active_scenario()
    rituals = scenario["rituals"]
    return {
        "rituals": rituals,
        "overdue_count": sum(1 for r in rituals if r["is_overdue"]),
    }


def get_recent_user_activity(user_id: str, days: int = 7) -> dict:
    """Return voice notes sent, touchpoints, and ritual completions in the window."""
    print(f"  [tool] get_recent_user_activity(user_id={user_id}, days={days})")
    scenario = get_active_scenario()
    activity = scenario["recent_activity"]

    voice_notes = activity["voice_notes_sent"]
    inner_circle_friend_ids = {
        fid for fid, f in scenario["friends"].items() if f["category"] == "inner_circle"
    }
    voice_notes_to_inner_circle = [
        vn for vn in voice_notes if vn["friend_id"] in inner_circle_friend_ids
    ]

    return {
        "voice_notes_sent": voice_notes,
        "voice_notes_to_inner_circle_count": len(voice_notes_to_inner_circle),
        "external_touchpoints": activity["external_touchpoints"],
        "ritual_completions": activity["ritual_completions"],
        "total_outreach_count": len(voice_notes)
            + len(activity["external_touchpoints"])
            + len(activity["ritual_completions"]),
    }


def get_recent_agent_history(user_id: str, days: int = 14) -> dict:
    """Return the agent's past decisions in the window."""
    print(f"  [tool] get_recent_agent_history(user_id={user_id}, days={days})")
    scenario = get_active_scenario()
    history = scenario["agent_history"]

    nudges_sent = [h for h in history if h["decision_type"] in ("nudge_sent", "ritual_suggested")]
    most_recent_nudge = nudges_sent[0] if nudges_sent else None

    return {
        "decisions": history,
        "nudges_in_window": len(nudges_sent),
        "most_recent_nudge": most_recent_nudge,
    }


def get_recent_voice_note_transcripts(user_id: str, days: int = 14) -> dict:
    """
    Return transcripts of recent voice notes.

    Note: For the contest demo, these are mocked. In production, this will
    pull from a Whisper or Gemini-Audio transcription pipeline.
    """
    print(f"  [tool] get_recent_voice_note_transcripts(user_id={user_id}, days={days})")
    scenario = get_active_scenario()
    transcripts = scenario["voice_note_transcripts"]
    return {
        "transcripts": transcripts,
        "count": len(transcripts),
    }


# ============================================================
# Group B: Reasoning tools
# ============================================================

def identify_quiet_friends(user_id: str, threshold_days: int = 14) -> dict:
    """Return friends who haven't been contacted in threshold_days+, sorted descending."""
    print(f"  [tool] identify_quiet_friends(user_id={user_id}, threshold_days={threshold_days})")
    scenario = get_active_scenario()
    friends = scenario["friends"].values()
    quiet = [f for f in friends if f["days_quiet"] >= threshold_days]
    quiet_sorted = sorted(quiet, key=lambda f: f["days_quiet"], reverse=True)

    return {
        "quiet_friends": quiet_sorted,
        "count": len(quiet_sorted),
        "threshold_days": threshold_days,
    }


def check_nudge_eligibility(user_id: str) -> dict:
    """
    Check whether the user is eligible for a nudge today.

    Rules:
    - Max 2 nudges per week
    - At least 4 days between nudges
    - If user sent 2+ voice notes to inner_circle this week, NOT eligible
    """
    print(f"  [tool] check_nudge_eligibility(user_id={user_id})")
    scenario = get_active_scenario()

    # Rule 1: weekly cap
    history = scenario["agent_history"]
    nudges_this_week = [
        h for h in history
        if h["decision_type"] in ("nudge_sent", "ritual_suggested")
        and _within_days(h["run_at"], 7)
    ]
    if len(nudges_this_week) >= 2:
        return {
            "eligible": False,
            "reason": f"User has already received {len(nudges_this_week)} nudges this week (cap is 2).",
            "rule_violated": "weekly_cap",
        }

    # Rule 2: 4-day minimum gap
    if nudges_this_week:
        most_recent = nudges_this_week[0]
        if _within_days(most_recent["run_at"], 4):
            return {
                "eligible": False,
                "reason": f"Most recent nudge was less than 4 days ago.",
                "rule_violated": "minimum_gap",
            }

    # Rule 3: user already connecting on their own
    activity = scenario["recent_activity"]
    inner_circle_friend_ids = {
        fid for fid, f in scenario["friends"].items() if f["category"] == "inner_circle"
    }
    voice_notes_to_inner_circle = [
        vn for vn in activity["voice_notes_sent"] if vn["friend_id"] in inner_circle_friend_ids
    ]
    if len(voice_notes_to_inner_circle) >= 2:
        return {
            "eligible": False,
            "reason": f"User has sent {len(voice_notes_to_inner_circle)} voice notes to inner_circle friends this week. They are already connecting.",
            "rule_violated": "user_already_active",
        }

    return {
        "eligible": True,
        "reason": "User is eligible for a nudge today.",
        "rule_violated": None,
    }


def _within_days(iso_timestamp: str, days: int) -> bool:
    """Helper: is this timestamp within the last N days?"""
    ts = datetime.fromisoformat(iso_timestamp)
    return (datetime.utcnow() - ts) <= timedelta(days=days)


# ============================================================
# Group C: Action tools
# ============================================================

def compose_nudge_message(
    friend_id: str,
    user_context: dict,
    days_quiet: int,
    friend_category: str,
) -> dict:
    """
    Draft the nudge message text using Gemini.

    In the stub version, returns a hand-crafted message based on the friend
    and category. The real version will call Gemini with composition context.
    """
    print(f"  [tool] compose_nudge_message(friend_id={friend_id}, days_quiet={days_quiet}, category={friend_category})")
    scenario = get_active_scenario()
    friend = scenario["friends"].get(friend_id)
    user = scenario["user"]

    if not friend:
        return {"message": "Error: friend not found.", "tone": "error"}

    first_name = user["first_name"]
    friend_name = friend["name"]
    note = friend.get("note", "")

    # Soft message logic — sensitive note = softer language
    sensitive_keywords = ["sick", "cancer", "death", "divorce", "loss", "struggling", "carrying a lot"]
    is_sensitive = any(kw in note.lower() for kw in sensitive_keywords)

    if friend_category == "inner_circle":
        if is_sensitive:
            message = f"{first_name} — {friend_name}'s been quiet a while. A short voice note today might land just right for her."
        else:
            message = f"{first_name} — {friend_name}'s been on your mind, hasn't she? A 30-second voice note might be just enough today."
    elif friend_category == "village":
        message = f"{first_name} — it's been a beat since you and {friend_name} connected. No pressure, but a quick hello might feel good."
    else:
        message = f"{first_name} — {friend_name} hasn't heard from you in a while. Worth a quick check-in?"

    return {
        "message": message,
        "tone": "soft" if is_sensitive else "warm",
        "friend_id": friend_id,
        "friend_name": friend_name,
    }


def suggest_ritual_time(user_id: str, friend_id: str, ritual_name: str) -> dict:
    """
    Return a Google Calendar 'Add to Calendar' link for the suggested ritual.

    Generates a link that opens Google Calendar with the event pre-filled.
    """
    print(f"  [tool] suggest_ritual_time(user_id={user_id}, friend_id={friend_id}, ritual_name='{ritual_name}')")

    # Suggest the next upcoming Sunday at 10am UTC for the demo
    now = datetime.utcnow()
    days_until_sunday = (6 - now.weekday()) % 7 or 7
    suggested = now.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=days_until_sunday)
    end_time = suggested + timedelta(hours=1)

    start_str = suggested.strftime("%Y%m%dT%H%M%SZ")
    end_str = end_time.strftime("%Y%m%dT%H%M%SZ")

    params = {
        "action": "TEMPLATE",
        "text": ritual_name,
        "dates": f"{start_str}/{end_str}",
        "details": "A KinMatch ritual moment — a chance to reconnect.",
    }
    calendar_link = "https://calendar.google.com/calendar/render?" + urlencode(params)

    return {
        "calendar_link": calendar_link,
        "suggested_time_iso": suggested.isoformat(),
        "ritual_name": ritual_name,
    }


def send_nudge(
    user_id: str,
    friend_id: str,
    message: str,
    calendar_link: Optional[str] = None,
) -> dict:
    """
    Send the nudge to the user via email.

    For the demo, this prints to the console. In production, this triggers
    a Klaviyo event that sends the actual email.
    """
    print(f"  [tool] send_nudge(user_id={user_id}, friend_id={friend_id})")
    print(f"")
    print(f"    ┌──────────────────────────────────────────────────────────────")
    print(f"    │  ✉  NUDGE SENT")
    print(f"    │  To: {user_id}")
    print(f"    │  About friend: {friend_id}")
    print(f"    │")
    print(f"    │  {message}")
    if calendar_link:
        print(f"    │")
        print(f"    │  📅 Calendar link: {calendar_link[:80]}...")
    print(f"    └──────────────────────────────────────────────────────────────")
    print(f"")

    return {
        "sent": True,
        "user_id": user_id,
        "friend_id": friend_id,
        "message": message,
        "calendar_link": calendar_link,
        "sent_at": datetime.utcnow().isoformat(),
    }


def log_decision(
    user_id: str,
    decision_type: str,
    reasoning: str,
    friend_id: Optional[str] = None,
    message: Optional[str] = None,
) -> dict:
    """
    Write the agent's decision to the decision log.

    Every agent run produces a log entry, regardless of outcome.
    """
    print(f"  [tool] log_decision(decision_type='{decision_type}', friend_id={friend_id})")
    print(f"          reasoning: {reasoning}")

    return {
        "logged": True,
        "user_id": user_id,
        "decision_type": decision_type,
        "reasoning": reasoning,
        "friend_id": friend_id,
        "message": message,
        "logged_at": datetime.utcnow().isoformat(),
    }


# ============================================================
# Group D: Meta tool
# ============================================================

def finish(decision_type: str, summary: str) -> dict:
    """
    Signal that the agent has completed its run.

    Called once at the end of every agent execution.
    """
    print(f"  [tool] finish(decision_type='{decision_type}')")
    print(f"")
    print(f"  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  ✓ Agent run complete")
    print(f"    Decision: {decision_type}")
    print(f"    Summary:  {summary}")
    print(f"  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return {
        "finished": True,
        "decision_type": decision_type,
        "summary": summary,
    }


# ============================================================
# Tool registry — used by the agent to look up tool functions by name
# ============================================================

TOOLS = {
    "get_user_profile": get_user_profile,
    "get_user_tribe": get_user_tribe,
    "get_user_rituals": get_user_rituals,
    "get_recent_user_activity": get_recent_user_activity,
    "get_recent_agent_history": get_recent_agent_history,
    "get_recent_voice_note_transcripts": get_recent_voice_note_transcripts,
    "identify_quiet_friends": identify_quiet_friends,
    "check_nudge_eligibility": check_nudge_eligibility,
    "compose_nudge_message": compose_nudge_message,
    "suggest_ritual_time": suggest_ritual_time,
    "send_nudge": send_nudge,
    "log_decision": log_decision,
    "finish": finish,
}