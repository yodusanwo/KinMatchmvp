# KinMatch — Devpost Writeup

---

## Project Tagline

KinMatch helps adults build deeper friendships through intentional connection, relationship memory, and meaningful follow through.

---

## What It Does

KinMatch is an AI-powered relationship continuity platform designed to help adults build and maintain meaningful friendships in an increasingly disconnected world. Rather than focusing on matching strangers or creating another social network, KinMatch helps people strengthen the relationships already forming in their lives and intentionally invest in the people they want to grow closer to.

The platform acts as a relationship companion that helps users remember important details about the people they meet, identify opportunities to reconnect, overcome social friction, and create recurring moments of interaction that allow friendships to deepen over time. By combining behavioral science, relationship psychology, and AI, KinMatch helps transform acquaintances into friends, friends into a trusted inner circle, and connection into belonging.

---

## Inspiration

We are living through a loneliness epidemic. Despite having more ways to connect than ever before, millions of adults report feeling isolated, disconnected, and lacking the meaningful relationships that contribute to health, happiness, and overall well-being. At the same time, many of the traditional structures that once fostered friendship and community have weakened due to remote work, geographic mobility, smaller families, longer periods of living alone, and increasing dependence on digital interaction.

Yet loneliness is rarely caused by a lack of people. Most adults know coworkers, neighbors, gym friends, alumni, fellow parents, and acquaintances they genuinely enjoy. The challenge is that modern life makes it difficult to transform those connections into lasting friendships. Busy schedules, emotional hesitation, social anxiety, forgetfulness, and a lack of recurring interaction often cause promising relationships to fade before they have a chance to grow.

KinMatch was inspired by a simple belief: meaningful friendships should not be left to chance. We believe technology should strengthen human connection, not replace it. By helping people remember, reconnect, follow through, and intentionally invest in the relationships that matter most, KinMatch aims to help people build the trusted inner circles, support systems, and sense of belonging that every human needs to thrive.

---

## How We Built It

The agent runs on **Google Cloud Run**, orchestrated by **Google ADK 2.2.0**, reasoning through **Gemini 2.5 Flash** on Vertex AI. ADK registers 13 Python tools the model can call to read user data, evaluate signals, and log decisions.

**Reasoning loop:** ADK Runner sends the user request to Gemini, executes the tool calls Gemini plans, and feeds results back until the agent calls `finish()`. A full run takes 30-90 seconds.

**Data access:** The agent never touches Supabase directly. It exchanges a shared secret (stored in **Google Secret Manager**) for a user-scoped JWT, then calls the KinMatch API — operating under the same Row-Level Security policies as the user.

**MCP integration:** Brand-voice composition is exposed as a callable tool via the **Model Context Protocol** using FastMCP. Cursor (our dev environment) connects to the same MCP server, proving the tool is genuinely reusable beyond our agent.

**Privacy by design:** The agent reads structured engagement signals (was the voice note listened to?) and unstructured memory notes the user writes. It does **not** transcribe voice content. That's a product decision, not a limitation.

**Observability:** Every run is traced through **Cloud Trace** and logged to a Supabase `agent_decisions` table with full reasoning text.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

---

## Challenges We Ran Into

**Cloud Run deployment cascade.** Five failed deploys before success. Each one taught us something specific: missing OpenTelemetry exporter, ADK requires underscore agent names (no hyphens), and relative imports that worked locally broke in Cloud Run's package structure. Eight minutes per cycle to verify each fix.

**Service-to-service auth without privilege creep.** The agent needed to act on a user's data without admin database access. We built a two-step flow: shared secret → user-scoped JWT → standard API calls. The agent sees only what the user can see.

**Choosing what NOT to do.** We deliberately deferred voice note transcription, ritual scheduling UI flows, and email integration via Klaviyo — captured them in `PILOT_BLOCKERS.md` instead of building them. Most contest teams over-scope. We under-scoped on purpose.

**Time-boxed last-day engineering.** Late in the build, we discovered `suggest_ritual_time` was scaffolded but not fully wired. Under a strict 3-hour time box, we built the missing API endpoint, redeployed Cloud Run, and verified end-to-end against real production data. Time discipline matters more than engineering range.

**Reasoning that picks the right friend.** Early versions used a single rule: days since last contact. Real friendship doesn't work that way. We added engagement signals and tone calibration. The agent now picks Mary over Ronda (despite Ronda being quieter) because Ronda shows `no_engagement`. In a production run today, the agent observed the user had sent 10 voice notes this week and decided no nudge was needed — *"she is already maintaining her rhythm."*

---

## What We Learned

**Restraint is a feature.** The agent's most important behavior is often deciding *not* to act. Building in the discipline to wait is what makes it feel thoughtful, not noisy.

**Privacy unlocks trust, not just compliance.** Choosing not to transcribe voice notes wasn't a regulatory call — it was a product call. Users share more authentic context when they trust the system to respect their data.

**MCP changes the reusability conversation.** Exposing brand voice via MCP means it's no longer trapped inside one agent. It's a callable service that future agents, or external tools like Cursor, can use.

**ADK saves real time.** Standardized session management, auto-generated tool schemas, native Cloud Run deployment, built-in tracing. The defaults are good defaults.

**Infrastructure from the framework, nuance from the tools** The framework gave us infrastructure; the tooling gave us nuance. ADK saved us real engineering time — session management, deployment, observability all came for free. But the agent's nuanced reasoning came from elsewhere: layered tools (engagement signals, tone calibration, frequency discipline) and a system prompt that rewards observing context. In one production run today, the agent saw the user had sent 10 voice notes this week and decided "she is already maintaining her rhythm" — declining to act. That restraint is a reasoning feature, not a framework feature.

---

## What's Next for KinMatch

**Friend Rituals (Q3 2026).** The agent already reads active rituals. Next: expand UI flows for ritual creation and gentle reminders, plus deeper agent reasoning about ritual revival when users fall off-rhythm.

**Voice note transcription with per-note consent.** Richer reasoning is possible if the agent can read voice content. We're waiting until the consent UX is right — granular, explicit, user-controlled.

**Open the MCP surface.** We've proven the brand-voice MCP server works with Cursor. Exploring whether to publish it publicly so other developers can add KinMatch-style relational care capabilities to their own products.

---

## Built With

**Languages:** Python, TypeScript
**Frameworks:** Next.js 15, Google ADK 2.2.0, FastMCP 3.4.0
**AI/ML:** Gemini 2.5 Flash, Vertex AI
**Cloud:** Google Cloud Run, Google Secret Manager, Google Cloud Trace, Vercel
**Data:** Supabase, PostgreSQL
**Protocols:** Model Context Protocol (MCP)
**Other:** OpenTelemetry, Cursor
