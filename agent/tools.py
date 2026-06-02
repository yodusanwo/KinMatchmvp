"""
tools.py — Tool implementations for the KinMatch Relational Care Agent.

This module supports two modes controlled by the AGENT_MODE env var:

  AGENT_MODE=demo       → Tools read from fake_data.py (predictable scenarios)
  AGENT_MODE=production → Tools call real KinMatch APIs via api_client

Default: production.

The tool signatures and return shapes are IDENTICAL across modes, so the
agent's reasoning logic (agent.py, system_prompt.py) doesn't change at all.
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Mode flag: 'demo' or 'production'
AGENT_MODE = os.environ.get("AGENT_MODE", "production").lower()

# Import the right data source based on mode
if AGENT_MODE == "demo":
    from fake_data import get_active_scenario
    api_client = None
else:
    from api_client import get_client
    get_active_scenario = None
    # Lazy-init the API client per agent run
    _api_client_instance = None

    def _get_api_client():
        global _api_client_instance
        if _api_client_instance is None:
            _api_client_instance = get_client()
        return _api_client_instance


# ============================================================
# Group A: Read tools
# ============================================================

def get_user_profile(user_id: str) -> dict:
    """Return the user's name, held relationships, and preferences."""
    print(f"  [tool] get_user_profile(user_id={user_id})")

    if AGENT_MODE == "demo":
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
    else:
        client = _get_api_client()
        return client.get("/api/agent/user/profile")


def get_user_tribe(user_id: str) -> dict:
    """Return all friends with rhythm data AND the notes the user wrote."""
    print(f"  [tool] get_user_tribe(user_id={user_id})")

    if AGENT_MODE == "demo":
        scenario = get_active_scenario()
        friends = list(scenario["friends"].values())
        return {
            "friends": friends,
            "count": len(friends),
            "inner_circle_count": sum(1 for f in friends if f["category"] == "inner_circle"),
            "village_count": sum(1 for f in friends if f["category"] == "village"),
            "acquaintance_count": sum(1 for f in friends if f["category"] == "acquaintance"),
        }
    else:
        client = _get_api_client()
        return client.get("/api/agent/user/tribe")


def get_user_rituals(user_id: str) -> dict:
    """Return active rituals with names, participants, and overdue status."""
    print(f"  [tool] get_user_rituals(user_id={user_id})")

    if AGENT_MODE == "demo":
        scenario = get_active_scenario()
        rituals = scenario["rituals"]
        return {
            "rituals": rituals,
            "overdue_count": sum(1 for r in rituals if r["is_overdue"]),
        }
    else:
        # Rituals endpoint not built yet — return empty for production
        # TODO: Build /api/agent/user/rituals endpoint
        return {
            "rituals": [],
            "overdue_count": 0,
        }


def get_recent_user_activity(user_id: str, days: int = 7) -> dict:
    """Return voice notes sent, touchpoints, and ritual completions in the window."""
    print(f"  [tool] get_recent_user_activity(user_id={user_id}, days={days})")

    if AGENT_MODE == "demo":
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
    else:
        client = _get_api_client()
        result = client.get("/api/agent/user/activity", params={"days": days})
        # Add total_outreach_count for compatibility with demo mode shape
        result["total_outreach_count"] = result.get("total_interactions", 0)
        # external_touchpoints and ritual_completions aren't tracked separately in production yet
        result.setdefault("external_touchpoints", [])
        result.setdefault("ritual_completions", [])
        return result


def get_recent_agent_history(user_id: str, days: int = 14) -> dict:
    """Return the agent's past decisions in the window."""
    print(f"  [tool] get_recent_agent_history(user_id={user_id}, days={days})")

    if AGENT_MODE == "demo":
        scenario = get_active_scenario()
        history = scenario["agent_history"]

        nudges_sent = [h for h in history if h["decision_type"] in ("nudge_sent", "ritual_suggested")]
        most_recent_nudge = nudges_sent[0] if nudges_sent else None

        return {
            "decisions": history,
            "nudges_in_window": len(nudges_sent),
            "most_recent_nudge": most_recent_nudge,
        }
    else:
        client = _get_api_client()
        return client.get("/api/agent/user/agent-history", params={"days": days})


def get_recent_voice_note_transcripts(user_id: str, days: int = 14) -> dict:
    """
    Return transcripts of recent voice notes.

    Note: Voice note transcription pipeline is post-contest work.
    For now: returns mocked transcripts in demo mode, empty in production.
    """
    print(f"  [tool] get_recent_voice_note_transcripts(user_id={user_id}, days={days})")

    if AGENT_MODE == "demo":
        scenario = get_active_scenario()
        transcripts = scenario["voice_note_transcripts"]
        return {
            "transcripts": transcripts,
            "count": len(transcripts),
        }
    else:
        # Voice transcription pipeline deferred post-contest
        return {
            "transcripts": [],
            "count": 0,
        }


# ============================================================
# Group B: Reasoning tools
# These operate on data the agent has already fetched, no API needed.
# ============================================================

def identify_quiet_friends(user_id: str, threshold_days: int = 14) -> dict:
    """Return friends who haven't been contacted in threshold_days+, sorted descending."""
    print(f"  [tool] identify_quiet_friends(user_id={user_id}, threshold_days={threshold_days})")

    # Fetch the tribe (works in both modes)
    tribe = get_user_tribe(user_id)
    friends = tribe["friends"]

    # Filter to quiet ones — handle None days_quiet
    quiet = [
        f for f in friends
        if f.get("days_quiet") is not None and f["days_quiet"] >= threshold_days
    ]
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

    # Rule 1 & 2: weekly cap and minimum gap
    history = get_recent_agent_history(user_id, days=14)
    nudges_this_week = [
        d for d in history["decisions"]
        if d.get("decision_type") in ("nudge_sent", "ritual_suggested")
        and _within_days(d.get("run_at") or d.get("created_at"), 7)
    ]

    if len(nudges_this_week) >= 2:
        return {
            "eligible": False,
            "reason": f"User has already received {len(nudges_this_week)} nudges this week (cap is 2).",
            "rule_violated": "weekly_cap",
        }

    if nudges_this_week:
        most_recent = nudges_this_week[0]
        run_at = most_recent.get("run_at") or most_recent.get("created_at")
        if _within_days(run_at, 4):
            return {
                "eligible": False,
                "reason": "Most recent nudge was less than 4 days ago.",
                "rule_violated": "minimum_gap",
            }

    # Rule 3: user already connecting on their own
    activity = get_recent_user_activity(user_id, days=7)
    if activity.get("voice_notes_to_inner_circle_count", 0) >= 2:
        return {
            "eligible": False,
            "reason": f"User has sent {activity['voice_notes_to_inner_circle_count']} voice notes to inner_circle friends this week. They are already connecting.",
            "rule_violated": "user_already_active",
        }

    return {
        "eligible": True,
        "reason": "User is eligible for a nudge today.",
        "rule_violated": None,
    }


def _within_days(iso_timestamp: Optional[str], days: int) -> bool:
    """Helper: is this timestamp within the last N days?"""
    if not iso_timestamp:
        return False
    try:
        # Handle both 'Z' suffix and offset formats
        ts_str = iso_timestamp.replace("Z", "+00:00")
        ts = datetime.fromisoformat(ts_str)
        # Make ts naive for comparison if needed
        if ts.tzinfo is not None:
            ts = ts.replace(tzinfo=None)
        return (datetime.utcnow() - ts) <= timedelta(days=days)
    except (ValueError, AttributeError):
        return False


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
    Draft the nudge message text.

    In demo mode: uses hand-crafted templates based on friend category.
    In production: also uses templates (Gemini composition for the message
    body itself is handled by the agent's reasoning layer).
    """
    print(f"  [tool] compose_nudge_message(friend_id={friend_id}, days_quiet={days_quiet}, category={friend_category})")

    # Fetch the friend's name and any notes
    if AGENT_MODE == "demo":
        scenario = get_active_scenario()
        friend = scenario["friends"].get(friend_id)
        if not friend:
            return {"message": "Error: friend not found.", "tone": "error"}
        friend_name = friend["name"]
        note = friend.get("note", "")
    else:
        # Look up friend from the tribe data
        tribe = get_user_tribe(user_id=user_context.get("user_id", ""))
        friend = next((f for f in tribe["friends"] if f["friend_id"] == friend_id), None)
        if not friend:
            return {"message": "Error: friend not found.", "tone": "error"}
        friend_name = friend["name"]
        # Combine all notes into a single string for tone analysis
        notes_list = friend.get("notes", [])
        note = " ".join(n.get("text", "") for n in notes_list) if notes_list else ""

    first_name = user_context.get("first_name", "")

    # Soft message logic — sensitive note = softer language
    sensitive_keywords = ["sick", "cancer", "death", "divorce", "loss", "struggling", "carrying a lot", "health"]
    is_sensitive = any(kw in note.lower() for kw in sensitive_keywords)

    if friend_category == "inner_circle":
        if is_sensitive:
            message = f"{first_name} — {friend_name}'s been quiet a while. A short voice note today might land just right."
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

    Same logic in demo and production — generates a URL, no DB needed.
    """
    print(f"  [tool] suggest_ritual_time(user_id={user_id}, friend_id={friend_id}, ritual_name='{ritual_name}')")

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

    Currently mocked for the contest. Post-contest: triggers Klaviyo email.
    """
    print(f"  [tool] send_nudge(user_id={user_id}, friend_id={friend_id})")
    print(f"")
    print(f"    ┌──────────────────────────────────────────────────────────────")
    print(f"    │  ✉  NUDGE SENT  [{AGENT_MODE.upper()} MODE — MOCKED]")
    print(f"    │  To user: {user_id}")
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
        "delivery": "mocked",
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

    In demo mode: just prints, doesn't persist.
    In production: POSTs to /api/agent/decisions for real audit trail.
    """
    print(f"  [tool] log_decision(decision_type='{decision_type}', friend_id={friend_id})")
    print(f"          reasoning: {reasoning}")

    if AGENT_MODE == "demo":
        return {
            "logged": True,
            "user_id": user_id,
            "decision_type": decision_type,
            "reasoning": reasoning,
            "friend_id": friend_id,
            "message": message,
            "logged_at": datetime.utcnow().isoformat(),
            "persistence": "demo_mode_no_persist",
        }
    else:
        client = _get_api_client()
        body = {
            "decision_type": decision_type,
            "reasoning": reasoning,
        }
        if friend_id:
            body["friend_id"] = friend_id
        if message:
            body["message"] = message

        try:
            result = client.post("/api/agent/decisions", json=body)
            return {
                "logged": True,
                "decision_id": result.get("id"),
                "user_id": user_id,
                "decision_type": decision_type,
                "reasoning": reasoning,
                "friend_id": friend_id,
                "message": message,
                "logged_at": result.get("created_at"),
                "persistence": "supabase",
            }
        except Exception as e:
            print(f"  ⚠ Failed to log decision: {e}")
            return {
                "logged": False,
                "error": str(e),
                "decision_type": decision_type,
            }


# ============================================================
# Group D: Meta tool
# ============================================================

def finish(decision_type: str, summary: str) -> dict:
    """Signal that the agent has completed its run."""
    print(f"  [tool] finish(decision_type='{decision_type}')")
    print(f"")
    print(f"  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  ✓ Agent run complete [{AGENT_MODE.upper()} MODE]")
    print(f"    Decision: {decision_type}")
    print(f"    Summary:  {summary}")
    print(f"  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    return {
        "finished": True,
        "decision_type": decision_type,
        "summary": summary,
        "mode": AGENT_MODE,
    }


# ============================================================
# Tool registry
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