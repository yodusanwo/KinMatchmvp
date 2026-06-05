"""
test_adk_run.py — Verify ADK agent can execute end-to-end.

Runs a single ADK session with a synthetic prompt that should trigger
the compose_nudge_message tool. If we get a response back, the ADK
integration is functional.
"""
import os
import asyncio
from dotenv import load_dotenv

# Load .env BEFORE importing ADK so Vertex AI env vars are set
load_dotenv()

os.environ.setdefault("AGENT_MODE", "demo")

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from adk_agent import root_agent


async def main():
    print("Setting up ADK Runner...")

    # ADK sessions track conversation state
    session_service = InMemorySessionService()
    app_name = "kinmatch_test"
    user_id = "test_user_yewande"
    session_id = "test_session_1"

    # Create a session for this run
    await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
    )

    # The Runner orchestrates: model call → tool call → result → next model call
    runner = Runner(
        agent=root_agent,
        app_name=app_name,
        session_service=session_service,
    )

    # Synthetic prompt that should trigger compose_nudge_message
    prompt_text = (
        "Use the compose_nudge_message tool to draft a nudge for me. "
        "Friend name: Mary. My first name: Yewande. Days quiet: 21. "
        "Category: inner_circle. Emotional context: Mary has been carrying "
        "a lot since her dad got sick."
    )

    print(f"Sending prompt to agent...")
    print(f"  Prompt: {prompt_text[:80]}...")
    print()

    # ADK Runner returns an async iterator of events
    user_message = types.Content(
        role="user",
        parts=[types.Part(text=prompt_text)],
    )

    final_response = None
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message,
    ):
        # Each event is a step in the agent's reasoning
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response = event.content.parts[0].text
        else:
            # Print intermediate steps for visibility
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "function_call") and part.function_call:
                        print(f"  [tool call] {part.function_call.name}({dict(part.function_call.args)})")
                    elif hasattr(part, "function_response") and part.function_response:
                        print(f"  [tool result] {part.function_response.name} returned: {part.function_response.response}")
                    elif hasattr(part, "text") and part.text:
                        text = part.text.strip()
                        if text:
                            print(f"  [model] {text[:150]}")

    print()
    print("=" * 60)
    print("FINAL RESPONSE:")
    print("=" * 60)
    print(final_response or "(no final response)")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
