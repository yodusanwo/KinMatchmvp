"""
run_agent.py — Entry point to run the KinMatch Relational Care Agent.

Usage:
    python run_agent.py                       # Production mode, uses TEST_USER_ID from .env
    python run_agent.py production            # Production mode, explicit
    python run_agent.py production <user_id>  # Production mode, specific user
    python run_agent.py demo                  # Demo mode, default scenario (quiet_friend)
    python run_agent.py demo <scenario>       # Demo mode, specific scenario
                                              # scenarios: healthy, quiet_friend, overdue_ritual

Production mode runs the agent against real KinMatch data via the API.
Demo mode runs the agent against fake_data.py scenarios for predictable demos.

The mode is also controlled by AGENT_MODE in .env. Command-line args override
the env var for that single run.
"""

import os
import sys

from dotenv import load_dotenv

load_dotenv()


def main():
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
        print(f"  python run_agent.py                       # production, default user")
        print(f"  python run_agent.py production <user_id>  # production, specific user")
        print(f"  python run_agent.py demo <scenario>       # demo mode")
        sys.exit(1)

    # Force the mode for this run by setting env var BEFORE importing tools
    os.environ["AGENT_MODE"] = mode

    # Now import — tools.py reads AGENT_MODE at import time
    from agent import run_agent

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
            print(f"  python run_agent.py production <user_id>")
            sys.exit(1)

        print(f"")
        print(f"Running in PRODUCTION mode")
        print(f"Target user: {user_id}")

    result = run_agent(user_id=user_id)

    print(f"")
    print(f"Final result: {result}")
    print(f"")


if __name__ == "__main__":
    main()