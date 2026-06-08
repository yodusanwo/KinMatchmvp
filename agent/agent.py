"""
agent.py — The KinMatch Relational Care Agent

This file wires Gemini, the system prompt, and the tools together into a
runnable agent. The agent receives a user_id, reads the system prompt,
gains access to the tools, and runs end-to-end to produce a decision.

Architecture:
- Gemini 2.5 Flash with function calling enabled
- Tool definitions auto-generated from tools.py
- Agent loop: model decides → calls tool → model sees result → repeats → finish
"""

from google import genai
from google.genai import types

from system_prompt import SYSTEM_PROMPT
from tools import TOOLS

# ============================================================
# MCP integration (Phase 3)
# ============================================================
# When USE_MCP_FOR_NUDGES=true, compose_nudge_message is invoked via the
# Model Context Protocol (MCP) instead of as a direct Python function call.
# This demonstrates that KinMatch's brand voice is a composable capability,
# not locked inside the agent's reasoning loop. The MCP server (mcp_server.py)
# exposes the same logic — but any MCP-compatible client can use it.
#
# Required env: USE_MCP_FOR_NUDGES=true (in .env or shell environment)
import os
import asyncio
from contextlib import asynccontextmanager

USE_MCP_FOR_NUDGES = os.environ.get("USE_MCP_FOR_NUDGES", "false").lower() == "true"

# MCP imports are deferred — only loaded if MCP is enabled, so the agent still
# runs cleanly even if fastmcp isn't installed.
if USE_MCP_FOR_NUDGES:
    from fastmcp import Client
    from fastmcp.client.transports import PythonStdioTransport

    _MCP_SERVER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mcp_server.py")
    _MCP_PYTHON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "venv", "bin", "python")


def call_tool_via_mcp(tool_name: str, tool_args: dict) -> dict:
    """
    Invoke a tool through the MCP protocol instead of as a direct function call.

    Spawns the MCP server as a subprocess, connects via stdio, calls the tool,
    parses the result, and returns. The agent's reasoning loop is unchanged —
    only the execution path for this one tool is different.

    For the contest demo: this is the line where KinMatch's agent becomes a
    real MCP CLIENT, demonstrating end-to-end protocol use within our own system.
    """
    async def _call():
        transport = PythonStdioTransport(
            script_path=_MCP_SERVER_PATH,
            python_cmd=_MCP_PYTHON_PATH,
        )
        async with Client(transport) as client:
            result = await client.call_tool(tool_name, tool_args)
            # FastMCP returns a CallToolResult; extract the structured content
            if hasattr(result, "structured_content") and result.structured_content:
                return result.structured_content
            elif hasattr(result, "content") and result.content:
                # Fall back to text content if structured isn't available
                first = result.content[0]
                if hasattr(first, "text"):
                    import json
                    try:
                        return json.loads(first.text)
                    except json.JSONDecodeError:
                        return {"message": first.text, "tone": "unknown", "reasoning": "MCP returned non-JSON"}
            return {"error": "MCP tool returned no content"}

    return asyncio.run(_call())

# ============================================================
# Gemini configuration
# ============================================================

PROJECT_ID = "kinmatch-relational-agent"
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.5-flash"

# Max number of tool-call iterations before we force the agent to finish.
# Prevents infinite loops if the model gets stuck.
MAX_ITERATIONS = 25


# ============================================================
# Tool schema declarations
#
# Gemini's function calling needs each tool described in a schema so it
# knows what inputs to provide. These mirror the function signatures
# in tools.py.
# ============================================================

TOOL_DECLARATIONS = [
    {
        "name": "get_user_profile",
        "description": "Get the user's profile including their first name, held relationships, and communication preferences.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "The user's unique identifier."},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_user_tribe",
        "description": "Get the user's full tribe (friends) with rhythm data and the notes the user wrote about each friend. Notes contain emotional context.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_user_rituals",
        "description": "Get the user's active rituals and which ones are overdue.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_recent_user_activity",
        "description": "Get the user's recent activity (voice notes sent, touchpoints logged, rituals completed) in the past N days.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "days": {"type": "integer", "description": "Number of days to look back. Default 7."},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_recent_agent_history",
        "description": "Get the agent's past decisions for this user. Use this to avoid repeating yourself and to respect frequency caps.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "days": {"type": "integer", "description": "Number of days to look back. Default 14."},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_recent_voice_note_transcripts",
        "description": "Get transcripts of the user's recent voice notes. Use these for emotional context to soften your tone — never quote directly.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "days": {"type": "integer", "description": "Number of days to look back. Default 14."},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "identify_quiet_friends",
        "description": "Get friends who haven't been contacted in threshold_days+ days, sorted by days_quiet descending.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "threshold_days": {"type": "integer", "description": "Minimum days quiet to be included. Default 14."},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "check_nudge_eligibility",
        "description": "Check if the user is eligible to receive a nudge today. Enforces frequency cap, minimum gap, and active-user rules.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "compose_nudge_message",
        "description": "Draft the nudge message text for a specific friend, considering the user's context and the friend's category.",
        "parameters": {
            "type": "object",
            "properties": {
                "friend_id": {"type": "string"},
                "user_context": {"type": "object", "description": "The user's profile and preferences."},
                "days_quiet": {"type": "integer"},
                "friend_category": {"type": "string", "description": "family, inner_circle, village, or acquaintance."},
            },
            "required": ["friend_id", "user_context", "days_quiet", "friend_category"],
        },
    },
    {
        "name": "suggest_ritual_time",
        "description": "Generate a Google Calendar 'Add to Calendar' link for a ritual moment between the user and a friend.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "friend_id": {"type": "string"},
                "ritual_name": {"type": "string"},
            },
            "required": ["user_id", "friend_id", "ritual_name"],
        },
    },
    {
        "name": "send_nudge",
        "description": "Send the nudge to the user via email (mocked in demo — prints to console). Use this once you've decided what to send.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "friend_id": {"type": "string"},
                "message": {"type": "string"},
                "calendar_link": {"type": "string", "description": "Optional Google Calendar link if suggesting a ritual."},
            },
            "required": ["user_id", "friend_id", "message"],
        },
    },
    {
        "name": "log_decision",
        "description": "Log the agent's decision with reasoning. Call this once per run, regardless of outcome.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {"type": "string"},
                "decision_type": {
                    "type": "string",
                    "description": "One of: nudge_sent, ritual_suggested, no_action_needed, no_eligible_friends, frequency_cap_reached, error",
                },
                "reasoning": {"type": "string", "description": "Explain WHY you made this decision."},
                "friend_id": {"type": "string"},
                "message": {"type": "string"},
            },
            "required": ["user_id", "decision_type", "reasoning"],
        },
    },
    {
        "name": "finish",
        "description": "Signal that the agent has completed its run. MUST be called exactly once at the very end of every run.",
        "parameters": {
            "type": "object",
            "properties": {
                "decision_type": {
                    "type": "string",
                    "description": "One of: nudge_sent, ritual_suggested, no_action_needed, no_eligible_friends, frequency_cap_reached, error",
                },
                "summary": {"type": "string", "description": "A one-sentence human-readable summary of what happened."},
            },
            "required": ["decision_type", "summary"],
        },
    },
]


# ============================================================
# Agent runner
# ============================================================

def run_agent(user_id: str) -> dict:
    """
    Run the KinMatch Relational Care Agent for one user.

    Returns the final decision dict from the finish() tool call.
    """
    print(f"")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  KinMatch Relational Care Agent")
    print(f"  Running for user: {user_id}")
    print(f"  Model: {MODEL_NAME}")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"")

    # Initialize Gemini client in Vertex AI mode
    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )

    # Configure tools for function calling
    tools_config = types.Tool(function_declarations=TOOL_DECLARATIONS)
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[tools_config],
        temperature=0.7,
    )

    # Seed the conversation with the user's request
    initial_message = f"Today is your daily run for user_id='{user_id}'. Please proceed."
    contents = [
        types.Content(role="user", parts=[types.Part(text=initial_message)])
    ]

    final_result = None

    # The agent loop: model decides → calls tool → model sees result → repeats
    for iteration in range(MAX_ITERATIONS):
        print(f"  [iteration {iteration + 1}]")

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config,
        )

        if not response.candidates or not response.candidates[0].content.parts:
            print(f"  ⚠ No response parts. Exiting.")
            break

        # Process each part of the response
        has_function_calls = False
        function_responses = []

        for part in response.candidates[0].content.parts:
            if hasattr(part, "function_call") and part.function_call:
                has_function_calls = True
                fc = part.function_call
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}

                # Look up and call the tool
                if tool_name not in TOOLS:
                    print(f"  ⚠ Unknown tool: {tool_name}")
                    result = {"error": f"Unknown tool: {tool_name}"}
                else:
                    try:
                        # Phase 3: Route compose_nudge_message through MCP if enabled.
                        # Demonstrates KinMatch agent is itself an MCP client —
                        # invoking its own brand-voice tool through the Model
                        # Context Protocol rather than as a direct function call.
                        if USE_MCP_FOR_NUDGES and tool_name == "compose_nudge_message":
                            print(f"  [mcp] Routing {tool_name} through MCP server")
                            result = call_tool_via_mcp(tool_name, tool_args)
                        else:
                            result = TOOLS[tool_name](**tool_args)
                    except Exception as e:
                        print(f"  ⚠ Tool error: {e}")
                        result = {"error": str(e)}

                # Track if finish was called
                if tool_name == "finish":
                    final_result = result

                # Prepare the tool response for the next model call
                function_responses.append(
                    types.Part.from_function_response(
                        name=tool_name,
                        response=result,
                    )
                )

            elif hasattr(part, "text") and part.text:
                # Model produced some natural language alongside tool calls
                if part.text.strip():
                    print(f"  [model] {part.text.strip()[:200]}")

        # Add the model's response to the conversation
        contents.append(response.candidates[0].content)

        # If finish was called, we're done
        if final_result:
            break

        # If the model didn't call any tools, it's probably stuck
        if not has_function_calls:
            print(f"  ⚠ Model produced no tool calls. Exiting.")
            break

        # Add the tool responses for the next iteration
        contents.append(types.Content(role="user", parts=function_responses))

    if not final_result:
        print(f"")
        print(f"  ⚠ Agent did not call finish() within {MAX_ITERATIONS} iterations.")
        print(f"")

    return final_result or {"finished": False, "decision_type": "error", "summary": "Agent did not complete properly."}