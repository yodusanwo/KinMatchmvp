"""
adk_agent.py — KinMatch Relational Care Agent (ADK version)

Wraps the existing KinMatch agent logic in Google's Agent Development Kit (ADK).
Built side-by-side with agent.py during the contest sprint; once verified,
this becomes the contest submission's primary agent.

Architecture:
- ADK LlmAgent orchestration (Track 1 requirement)
- Gemini 2.5 Flash via Vertex AI (same as before)
- Tools passed directly as Python functions — ADK auto-generates declarations
  from type hints and docstrings
- Same system prompt content as agent.py
- Deployable to Cloud Run via `adk deploy cloud_run`
"""
import os
from dotenv import load_dotenv

# Load .env BEFORE importing ADK so Vertex AI env vars are set
load_dotenv()

# Ensure agent_mode is set before importing tools (tools.py reads at import time)
os.environ.setdefault("AGENT_MODE", "demo")

from google.adk.agents import LlmAgent

# Reuse the existing system prompt — same instructions, just wrapped in ADK
from system_prompt import SYSTEM_PROMPT

# Reuse one existing tool to start — we'll add mo this works
from tools import compose_nudge_message


# Build the ADK agent
# - model: Gemini 2.5 Flash (same as agent.py)
# - instruction: Our existing system prompt
# - tools: A list of Python functions; ADK introspects their signatures and docstrings
root_agent = LlmAgent(
    name="kinmatch_relational_care_agent",
    model="gemini-2.5-flash",
    description="KinMatch's relational care agent — reasons about a user's friendships and decides whether to nudge, suggest a ritual, or take no action today.",
    instruction=SYSTEM_PROMPT,
    tools=[
        compose_nudge_message,
    ],
)


if __name__ == "__main__":
    print(f"✅ ADK agent loaded: {root_agent.name}")
    print(f"   Model: {root_agent.model}")
    print(f"   Tools registered: {len(root_agent.tools)}")
    for tool in root_agent.tools:
        # ADK tools have a name (the function name)
        tool_name = getattr(tool, "name", None) or getattr(tool, "__name__", str(tool))
        print(f"     - {tool_name}")
