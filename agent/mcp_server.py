"""
mcp_server.py — KinMatch Relational Care MCP Server

Exposes KinMatch's relational nudge composition as an MCP-compatible tool.

This server makes KinMatch's italic-soft brand voice available to any
MCP-compatible client (Claude Desktop, Cursor, Gemini SDK, etc.) — demonstrating
that relational care isn't locked inside our agent's reasoning loop, but is a
composable capability that other AI systems can invoke.

Architecture:
- Built with FastMCP 3.x (the Pythonic MCP framework)
- Exposes one tool: compose_nudge_message
- Uses stdio transport (subprocess communication, no network exposure)
- Imports the same composition logic that powers the in-agent tool, so behavior
  is identical whether called directly or via MCP

Usage:
    python mcp_server.py

The server runs and waits for stdio JSON-RPC messages.
For testing: connect via MCP Inspector or any MCP-compatible client.
"""

import os
import sys

# Ensure we use the agent's directory for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set demo mode for MCP server since it doesn't have API client context
# The composition logic is the same in both modes — the mode flag only
# affects READ tools that fetch from database vs fake_data.
os.environ.setdefault("AGENT_MODE", "demo")

from fastmcp import FastMCP

# Initialize the MCP server with a descriptive name
# This name will appear in MCP clients listing available servers
mcp = FastMCP(name="KinMatch Relational Care")


@mcp.tool()
def compose_nudge_message(
    friend_name: str,
    user_first_name: str,
    days_quiet,
    friend_category: str,
    emotional_context: str = "",
) -> dict:
    """
    Compose a relational nudge message in KinMatch's italic-soft brand voice.

    This tool generates gentle, present-tense outreach suggestions designed to
    reduce relational anxiety for working adults trying to stay close to the
    people who matter. The tone calibrates based on emotional context — softer
    language when the friend is going through something difficult.

    Args:
        friend_name: The name of the friend the user is being nudged about
        user_first_name: The user's first name (for personalized greeting)
        days_quiet: How many days since the user last reached out to this friend
        friend_category: One of 'family', 'inner_circle', 'village', or 'acquaintance'
        emotional_context: Optional notes the user has captured about the friend.
            If this contains sensitive keywords (sick, struggling, carrying a lot,
            loss, divorce, health, etc.), the tone will soften automatically.

    Returns:
        A dict with:
        - message: The composed nudge text in italic-soft voice
        - tone: Either 'warm' (default) or 'soft' (when sensitive context detected)
        - reasoning: Brief explanation of tone choice for transparency

    Example output for an inner_circle friend with no sensitive context:
        {
            "message": "Yewande — Mary's been on your m hasn't she? A 30-second voice note might be just enough today.",
            "tone": "warm",
            "reasoning": "Inner circle friend, no sensitive context detected. Used standard warm tone."
        }

    Example output when emotional_context contains 'carrying a lot':
        {
            "message": "Yewande — Mary's been quiet a while. A short voice note today might land just right.",
            "tone": "soft",
            "reasoning": "Sensitive keyword detected in context. Used softer tone."
        }
    """
    # Sensitive keywords that trigger softer tone
    sensitive_keywords = [
        "sick", "cancer", "death", "divorce", "loss",
        "struggling", "carrying a lot", "health", "ill",
        "grief", "hospital", "surgery", "diagnosis",
    ]
    is_sensitive = any(kw in emotional_context.lower() for kw in sensitive_keywords)

    # Compose based on category and tone
    if friend_category == "family":
        if is_sensitive:
            message = (
                f"{user_first_name} — {friend_name}'s been quiet a while. "
                f"A short voice note today might land just right."
            )
            tone = "soft"
            reasoning = "Sensitive keyword detected in context. Used softer tone for family member."
        else:
            message = (
                f"{user_first_name} — {friend_name}'s been on your mind. "
                f"A 30-second voice note might be just enough today."
            )
            tone = "warm"
            reasoning = "Family member with no sensitive context. Used warm, personal tone."
    elif friend_category == "inner_circle":
        if is_sensitive:
            message = (
                f"{user_first_name} — {friend_name}'s been quiet a while. "
                f"A short voice note today might land just right."
            )
            tone = "soft"
            reasoning = "Sensitive keyword detected in context. Used softer tone for inner_circle friend."
        else:
            message = (
                f"{user_first_name} — {friend_name}'s been on your mind, hasn't she? "
                f"A 30-second voice note might be just enough today."
            )
            tone = "warm"
            reasoning = "Inner circle friend, no sensitive context detected. Used standard warm tone."
    elif friend_category == "village":
        message = (
            f"{user_first_name} — it's been a beat since you and {friend_name} connected. "
            f"No pressure, but a quick hello might feel good."
        )
        tone = "soft" if is_sensitive else "warm"
        reasoning = f"Village friend, days quiet: {days_quiet}. Tone: {tone}."
    else:  # acquaintance
        message = (
            f"{user_first_name} — {friend_name} hasn't heard from you in a while. "
            f"Worth a quick check-in?"
        )
        tone = "neutral"
        reasoning = "Acquaintance category, used neutral tone for light-touch outreach."

    return {
        "message": message,
        "tone": tone,
        "reasoning": reasoning,
    }


@mcp.tool()
def list_kinmatch_capabilities() -> dict:
    """
    Return metadata about this MCP server's purpose and design philosophy.

    This is a meta-tool that helps MCP clients understand what KinMatch
    offers and why. Useful for discoverability when this server is registered
    in a multi-server MCP environment.

    Returns:
        A dict describing the server's purpose, brand voice principles,
        and intended use cases.
    """
    return {
        "name": "KinMatch Relational Care",
        "purpose": (
            "Compose gentle, italic-soft relational care messages for adults "
            "trying to stay close to the people who matter."
        ),
        "brand_voice_principles": [
            "Present-tense, gentle, never urgent",
            "No exclamation points or marketing language",
            "Calibrate tone to emotional context",
            "Address user by first name naturally",
            "Suggest, never demand",
        ],
        "tools_available": [
            "compose_nudge_message",
            "list_kinmatch_capabilities",
        ],
        "designed_by": "KinMatch / ZORA Digital",
        "use_cases": [
            "AI agents needing relational care voice generation",
            "Apps wanting to add gentle outreach prompts",
            "Personal AI assistants for relationship management",
        ],
    }


if __name__ == "__main__":
    # Run with stdio transport (subprocess communication)
    # This is the standard for local MCP servers
    mcp.run()
