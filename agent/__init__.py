"""
agent package — KinMatch Relational Care Agent

Exposes root_agent for ADK deployment tooling.
The ADK CLI (adk deploy cloud_run) imports from this package.
"""
from .adk_agent import root_agent

__all__ = ["root_agent"]
