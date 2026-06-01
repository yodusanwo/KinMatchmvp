"""
run_agent.py — Entry point to run the KinMatch Relational Care Agent.

Usage:
    python run_agent.py                          # runs the quiet_friend scenario
    python run_agent.py healthy                  # runs the healthy scenario
    python run_agent.py overdue_ritual           # runs the overdue ritual scenario

The scenario controls which fake data the agent reads.
"""

import sys

from fake_data import set_active_scenario
from agent import run_agent


def main():
    # Get scenario from command line, default to quiet_friend
    scenario = sys.argv[1] if len(sys.argv) > 1 else "quiet_friend"

    if scenario not in ("healthy", "quiet_friend", "overdue_ritual"):
        print(f"Unknown scenario: {scenario}")
        print(f"Available scenarios: healthy, quiet_friend, overdue_ritual")
        sys.exit(1)

    print(f"")
    print(f"Setting active scenario: {scenario}")
    set_active_scenario(scenario)

    result = run_agent(user_id="user_yewande_demo")

    print(f"")
    print(f"Final result: {result}")
    print(f"")


if __name__ == "__main__":
    main()