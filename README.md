# KinMatch — Autonomous Relational Care Agent

> Helping adults build deeper friendships through intentional connection.

**Contest submission** for the [Google for Startups AI Agents Challenge](https://rapid-agent.devpost.com/) — Track 1: Build (Net-New Agents).

## Overview

KinMatch is an AI-powered relationship continuity platform for working adults. The contest submission is the **KinMatch Relational Care Agent** — an autonomous AI that observes a user's tribe of friends and proposes outreach when it matters, and stays quiet when it doesn't.

The agent reads structured engagement signals (whether voice notes get listened to) and unstructured memory notes the user has written about each friend. It reasons across engagement signals, tone calibration, and frequency discipline. Most days, its best behavior is choosing not to act.

## Live Resources

| Resource | Link |
|---|---|
| **Agent API Documentation** | https://kinmatch-agent-46939916931.us-central1.run.app/docs |
| **Consumer App** (pilot) | https://app.kinmatch.co |
| **Marketing Site** | https://kinmatch.co |
| **Demo Video** | https://youtu.be/AChsqAtgb1I?si=SdAM8H66Np7bI5zw |

## Mandatory Technologies

All four contest-mandated technologies are deeply integrated:

| Requirement | Implementation |
|---|---|
| **Intelligence** | Gemini 2.5 Flash via Vertex AI |
| **Orchestration** | Google Agent Development Kit (ADK) 2.2.0 with 13 registered tools |
| **Infrastructure** | Google Cloud Run, deployed in us-central1 |
| **MCP Integration** | FastMCP 3.4.0 server exposing context-aware tone composition |

Production-grade extras: Google Secret Manager for service-to-service auth, Google Cloud Trace for observability, Supabase for persistent agent decision logs.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete technical architecture, including:

- System architecture diagram
- Agent reasoning deep dive
- Three-layer reasoning model (engagement signals, tone calibration, frequency discipline)
- Data flow and authentication architecture
- Key design decisions and tradeoffs

## Repository Structure

```
KinMatch MVP/
├── agent/                    # The contest deliverable
│   ├── adk_agent.py          # ADK LlmAgent with 13 tools
│   ├── tools.py              # Tool implementations
│   ├── system_prompt.py      # Agent reasoning instructions
│   ├── mcp_server.py         # FastMCP server for tool composability
│   ├── api_client.py         # Two-step auth client for KinMatch API
│   └── run_adk_agent.py      # Local CLI entry point
├── src/                      # Next.js consumer app (app.kinmatch.co)
├── assets/                   # Architecture diagrams
├── ARCHITECTURE.md           # Full technical documentation
└── README.md                 # This file
```

## Quickstart (Local Agent)

```bash
# Clone and set up
git clone https://github.com/yodusanwo/KinMatchmvp.git
cd KinMatchmvp/agent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Authenticate to Google Cloud
gcloud auth application-default login

# Run the agent in production mode
cd ..
AGENT_MODE=production python -m agent.run_adk_agent
```

The agent will load the user's tribe, evaluate engagement signals, check nudge eligibility, and either propose outreach or stay quiet — all reasoned through Gemini 2.5 Flash with full Cloud Trace observability.

## Testing the Deployed Agent

```bash
# Verify the Cloud Run service is alive
curl https://kinmatch-agent-46939916931.us-central1.run.app/list-apps

# Create a session
curl -X POST "https://kinmatch-agent-46939916931.us-central1.run.app/apps/kinmatch_agent/users/judge_test/sessions" \
  -H "Content-Type: application/json" -d '{}'
```

For full interactive API documentation, visit the [Swagger UI](https://kinmatch-agent-46939916931.us-central1.run.app/docs).

## What Makes the Agent Different

**Restraint is a feature.** In a production verification run, the agent observed that the user had already sent thirteen voice notes to inner-circle friends that week and decided no nudge was needed — "she is already maintaining her rhythm." A simpler agent would have nudged anyway because a friend was technically "quiet."

**Privacy-first by design.** The agent never transcribes voice note content. It reads engagement signals (was the voice note listened to?) and unstructured memory notes the user explicitly wrote. Trust is the foundation of relational care.

**Tool composability via MCP.** Context-aware tone composition is exposed via the Model Context Protocol, so external clients like Cursor can use the same brand-voice capability that powers the agent.

## Team

Built by [Yewande Odusanwo](https://www.linkedin.com/in/yewandeodusanwo/), founder of [ZORA Digital](https://www.zora.digital) and KinMatch.

## License

This project is provided for evaluation as a contest submission. All third-party dependencies retain their original licenses (Apache 2.0, BSD).
