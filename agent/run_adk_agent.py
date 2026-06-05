"""
run_adk_agent.py — Entry point to run the KinMatch Relational Care Agent (ADK version).

Usage:
    python run_adk_agent.py                       # Production mode, uses TEST_USER_ID from .env
    python run_adk_agent.py production            # Production mode, explicit
    python run_adk_agent.py production <user_id>  # Production mode, specific user
    python run_adk_agent.py demo                  # Demo mode, default scenario (quiet_friend)
    python run_adk_agent.py demo <scenario>       # Demo mode, specific scenario
                                                  # scenarios: healthy, quiet_friend, overdue_ritual

Production mode runs the agent against real KinMatch data via the API.
Demo mode runs the agent against fake_data.py scenarios for predictable demos.

This version uses Google's Agent Development Kit (ADK) instead of the hand-rolled agent loop.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()


async def main():
    args = sys.argv[1:]

    # Parse mode and optional second arg
    if len(args) == 0:
        # Default: production mode, use TEST_USER_ID from env
        mode = "production"
        second_arg = None
    else:
        mode = args[0].lower()
        second_arg = args[1] if len(args) > 1 else None

    # Validate mode
    if mode not in ("production", "demo"):
        print(f"Unknown mode: {mode}")
        print(f"Usage:")
        print(f"  python run_adk_agent.py                       # production, default user")
        print(f"  python run_adk_agent.py production <user_id>  # production, specific user")
        print(f"  python run_adk_agent.py demo <scenario>       # demo mode")
        sys.exit(1)

    # Force the mode for this run by setting env var BEFORE importing tools
    os.environ["AGENT_MODE"] = mode

    # Now import — tools.py reads AGENT_MODE at import time, and adk_agent imports tools
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types
    from adk_agent import root_agent

    if mode == "demo":
        from fake_data import set_active_scenario

        scenario = second_arg or "quiet_friend"
        if scenario not in ("healthy", "quiet_friend", "overdue_ritual"):
            print(f"Unknown scenario: {scenario}")
            print(f"Available: healthy, quiet_friend, overdue_ritual")
            sys.exit(1)

        print(f"")
        print(f"Running in DEMO mode")
        print(f"Setting active scenario: {scenario}")
        set_active_scenario(scenario)
        user_id = "user_yewande_demo"

    else:  # production
        user_id = second_arg or os.environ.get("TEST_USER_ID")
        if not user_id:
            print(f"Production mode requires a user_id.")
            print(f"Either set TEST_USER_ID in .env or pass it as an argument:")
            print(f"  python run_adk_agent.py production <user_id>")
            sys.exit(1)

        print(f"")
        print(f"Running in PRODUCTION mode")
        print(f"Target user: {user_id}")

    # Print opening box
    print(f"")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"  KinMatch Relational Care Agent (ADK)")
    print(f"  Running for user: {user_id}")
    print(f"  Model: {root_agent.model}")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"")

    # Set up ADK session and runner
    session_service = InMemorySessionService()
    app_name = "kinmatch_relational_care"
    session_id = f"run_{user_id}_{mode}"

    await session_service.create_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
    )

    runner = Runner(
        agent=root_agent,
        app_name=app_name,
        session_service=session_service,
    )

    # Prompt the agent to run its full reasoning loop
    prompt_text = (
        f"Run your relational care analysis for user_id='{user_id}'. "
        f"Follow your full reasoning loop and end with a logged decision and finish call."
    )

    user_message = types.Content(
        role="user",
        parts=[types.Part(text=prompt_text)],
    )

    # Track the finish result for the final summary
    final_result = None
    iteration = 0

    # Iterate through the agent's async events
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=user_message,
    ):
        if event.is_final_response():
            # Final response from the model (end of reasoning)
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        text = part.text.strip()
                        if text:
                            print(f"  [model final] {text[:200]}")
        else:
            # Intermediate steps: tool calls and results
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, "function_call") and part.function_call:
                        fc = part.function_call
                        tool_name = fc.name
                        tool_args = dict(fc.args) if fc.args else {}
                        
                        # Print iteration marker on first tool call of iteration
                        if iteration == 0 or not hasattr(part, "_iteration_printed"):
                            iteration += 1
                            print(f"  [iteration {iteration}]")
                        
                        print(f"  [tool] {tool_name}({', '.join(f'{k}={v}' for k, v in tool_args.items())})")
                        
                    elif hasattr(part, "function_response") and part.function_response:
                        fr = part.function_response
                        tool_name = fr.name
                        result = dict(fr.response) if fr.response else {}
                        
                        # Track finish() result
                        if tool_name == "finish" and result:
                            final_result = result
                        
                        # Don't print the full result, just note it was received
                        # (The finish() tool itself prints the completion box)
                        
                    elif hasattr(part, "text") and part.text:
                        text = part.text.strip()
                        if text:
                            print(f"  [model] {text[:200]}")

    # If finish wasn't called, print a warning
    if not final_result:
        print(f"")
        print(f"  ⚠ Agent did not call finish() within the run.")
        print(f"")
        final_result = {
            "finished": False,
            "decision_type": "error",
            "summary": "Agent did not complete properly.",
        }

    print(f"")
    print(f"Final result: {final_result}")
    print(f"")


if __name__ == "__main__":
    asyncio.run(main())
