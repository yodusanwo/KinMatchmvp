"""
fake_data.py — Mock data for the KinMatch Relational Care Agent demo.

This module provides three scenario datasets, each designed to trigger a
different agent decision path:

- SCENARIO_HEALTHY      → Should trigger "no_action_needed"
- SCENARIO_QUIET_FRIEND → Should trigger "nudge_sent"
- SCENARIO_OVERDUE_RITUAL → Should trigger "ritual_suggested"

For the contest demo, we'll switch between these to show the agent's full
decision range. In production, the agent reads from Supabase instead.

Set the active scenario by calling set_active_scenario(name) before running
the agent.
"""

from datetime import datetime, timedelta
from typing import Literal

# ============================================================
# Scenario state — set by run_agent.py
# ============================================================

ACTIVE_SCENARIO: str = "quiet_friend"


def set_active_scenario(name: Literal["healthy", "quiet_friend", "overdue_ritual"]):
    """Switch which scenario the fake tools return."""
    global ACTIVE_SCENARIO
    ACTIVE_SCENARIO = name


# ============================================================
# Helper — convert "N days ago" to ISO timestamp
# ============================================================

def days_ago(n: int) -> str:
    return (datetime.utcnow() - timedelta(days=n)).isoformat()


# ============================================================
# The user — same across all scenarios
# ============================================================

USER = {
    "user_id": "user_yewande_demo",
    "first_name": "Yewande",
    "email": "yewande@zora.digital",
    "held_relationships": ["friend_mary", "friend_tomi"],
    "onboarded_at": days_ago(45),
    "preferences": {
        "communication_style": "italic-soft",
        "preferred_contact_time": "weekday mornings",
    },
}


# ============================================================
# Friends — vary by scenario
# ============================================================

FRIENDS_BASE = {
    "friend_mary": {
        "friend_id": "friend_mary",
        "name": "Mary",
        "category": "inner_circle",
        "phone_number": "+15555550001",
        "note": "Carrying a lot with her dad's health. Lean gentle.",
        "avatar_color": "#B65232",
    },
    "friend_tomi": {
        "friend_id": "friend_tomi",
        "name": "Tomi",
        "category": "inner_circle",
        "phone_number": "+15555550002",
        "note": "Recently moved cross-country. Misses Chicago.",
        "avatar_color": "#2F4032",
    },
    "friend_mom": {
        "friend_id": "friend_mom",
        "name": "Mom",
        "category": "inner_circle",
        "phone_number": "+15555550003",
        "note": "Sunday coffee is our thing. She lights up when we talk.",
        "avatar_color": "#663092",
    },
    "friend_john": {
        "friend_id": "friend_john",
        "name": "John",
        "category": "village",
        "phone_number": None,
        "note": "John retreats when stressed. Gentle nudges only.",
        "avatar_color": "#FEBD11",
    },
    "friend_sade": {
        "friend_id": "friend_sade",
        "name": "Sade",
        "category": "village",
        "phone_number": "+15555550004",
        "note": "Quarterly catch-up vibe. We go deep when we connect.",
        "avatar_color": "#7E50A0",
    },
    "friend_alex": {
        "friend_id": "friend_alex",
        "name": "Alex",
        "category": "acquaintance",
        "phone_number": None,
        "note": "",
        "avatar_color": "#E89624",
    },
}


# ============================================================
# Scenario 1: HEALTHY — user is connecting on their own
# Expected agent decision: no_action_needed
# ============================================================

SCENARIO_HEALTHY = {
    "user": USER,
    "friends": {
        **FRIENDS_BASE,
        "friend_mary": {**FRIENDS_BASE["friend_mary"], "last_contact_at": days_ago(2), "days_quiet": 2},
        "friend_tomi": {**FRIENDS_BASE["friend_tomi"], "last_contact_at": days_ago(4), "days_quiet": 4},
        "friend_mom": {**FRIENDS_BASE["friend_mom"], "last_contact_at": days_ago(5), "days_quiet": 5},
        "friend_john": {**FRIENDS_BASE["friend_john"], "last_contact_at": days_ago(8), "days_quiet": 8},
        "friend_sade": {**FRIENDS_BASE["friend_sade"], "last_contact_at": days_ago(20), "days_quiet": 20},
        "friend_alex": {**FRIENDS_BASE["friend_alex"], "last_contact_at": days_ago(60), "days_quiet": 60},
    },
    "recent_activity": {
        "voice_notes_sent": [
            {"friend_id": "friend_mary", "sent_at": days_ago(2), "duration_seconds": 47},
            {"friend_id": "friend_tomi", "sent_at": days_ago(4), "duration_seconds": 38},
            {"friend_id": "friend_mom", "sent_at": days_ago(5), "duration_seconds": 92},
        ],
        "external_touchpoints": [],
        "ritual_completions": [],
    },
    "agent_history": [
        {"run_at": days_ago(9), "decision_type": "nudge_sent", "friend_id": "friend_sade"},
    ],
    "rituals": [
        {
            "ritual_id": "ritual_mom_coffee",
            "name": "Sunday morning coffee with Mom",
            "participants": ["friend_mom"],
            "frequency_days": 7,
            "last_occurrence_at": days_ago(5),
            "is_overdue": False,
        },
    ],
    "voice_note_transcripts": [
        {
            "voice_note_id": "vn_001",
            "friend_id": "friend_mary",
            "transcript": "Hey Mary, just wanted to say I'm thinking of you. Hope you got some rest this weekend. Love you.",
            "recorded_at": days_ago(2),
        },
    ],
}


# ============================================================
# Scenario 2: QUIET_FRIEND — Mary has gone quiet, user is inactive
# Expected agent decision: nudge_sent (about Mary, with soft tone)
# ============================================================

SCENARIO_QUIET_FRIEND = {
    "user": USER,
    "friends": {
        **FRIENDS_BASE,
        "friend_mary": {**FRIENDS_BASE["friend_mary"], "last_contact_at": days_ago(21), "days_quiet": 21},
        "friend_tomi": {**FRIENDS_BASE["friend_tomi"], "last_contact_at": days_ago(9), "days_quiet": 9},
        "friend_mom": {**FRIENDS_BASE["friend_mom"], "last_contact_at": days_ago(6), "days_quiet": 6},
        "friend_john": {**FRIENDS_BASE["friend_john"], "last_contact_at": days_ago(16), "days_quiet": 16},
        "friend_sade": {**FRIENDS_BASE["friend_sade"], "last_contact_at": days_ago(35), "days_quiet": 35},
        "friend_alex": {**FRIENDS_BASE["friend_alex"], "last_contact_at": days_ago(90), "days_quiet": 90},
    },
    "recent_activity": {
        "voice_notes_sent": [],
        "external_touchpoints": [],
        "ritual_completions": [],
    },
    "agent_history": [
        {"run_at": days_ago(12), "decision_type": "no_action_needed", "friend_id": None},
    ],
    "rituals": [
        {
            "ritual_id": "ritual_mom_coffee",
            "name": "Sunday morning coffee with Mom",
            "participants": ["friend_mom"],
            "frequency_days": 7,
            "last_occurrence_at": days_ago(6),
            "is_overdue": False,
        },
    ],
    "voice_note_transcripts": [
        {
            "voice_note_id": "vn_002",
            "friend_id": "friend_tomi",
            "transcript": "Tomi, I've been thinking about you all week. The move sounds hard. I'm here whenever you want to talk.",
            "recorded_at": days_ago(9),
        },
    ],
}


# ============================================================
# Scenario 3: OVERDUE_RITUAL — Sunday coffee ritual with Mom is overdue
# Expected agent decision: ritual_suggested
# ============================================================

SCENARIO_OVERDUE_RITUAL = {
    "user": USER,
    "friends": {
        **FRIENDS_BASE,
        "friend_mary": {**FRIENDS_BASE["friend_mary"], "last_contact_at": days_ago(8), "days_quiet": 8},
        "friend_tomi": {**FRIENDS_BASE["friend_tomi"], "last_contact_at": days_ago(5), "days_quiet": 5},
        "friend_mom": {**FRIENDS_BASE["friend_mom"], "last_contact_at": days_ago(18), "days_quiet": 18},
        "friend_john": {**FRIENDS_BASE["friend_john"], "last_contact_at": days_ago(10), "days_quiet": 10},
        "friend_sade": {**FRIENDS_BASE["friend_sade"], "last_contact_at": days_ago(40), "days_quiet": 40},
        "friend_alex": {**FRIENDS_BASE["friend_alex"], "last_contact_at": days_ago(75), "days_quiet": 75},
    },
    "recent_activity": {
        "voice_notes_sent": [
            {"friend_id": "friend_mary", "sent_at": days_ago(8), "duration_seconds": 31},
        ],
        "external_touchpoints": [],
        "ritual_completions": [],
    },
    "agent_history": [
        {"run_at": days_ago(8), "decision_type": "nudge_sent", "friend_id": "friend_mary"},
    ],
    "rituals": [
        {
            "ritual_id": "ritual_mom_coffee",
            "name": "Sunday morning coffee with Mom",
            "participants": ["friend_mom"],
            "frequency_days": 7,
            "last_occurrence_at": days_ago(18),
            "is_overdue": True,
        },
        {
            "ritual_id": "ritual_tomi_checkin",
            "name": "Bi-weekly check-in with Tomi",
            "participants": ["friend_tomi"],
            "frequency_days": 14,
            "last_occurrence_at": days_ago(5),
            "is_overdue": False,
        },
    ],
    "voice_note_transcripts": [
        {
            "voice_note_id": "vn_003",
            "friend_id": "friend_mary",
            "transcript": "Mary, just a quick check-in. Thinking about you. Talk soon.",
            "recorded_at": days_ago(8),
        },
    ],
}


# ============================================================
# Scenario lookup
# ============================================================

SCENARIOS = {
    "healthy": SCENARIO_HEALTHY,
    "quiet_friend": SCENARIO_QUIET_FRIEND,
    "overdue_ritual": SCENARIO_OVERDUE_RITUAL,
}


def get_active_scenario() -> dict:
    """Return the currently active scenario dict."""
    return SCENARIOS[ACTIVE_SCENARIO]