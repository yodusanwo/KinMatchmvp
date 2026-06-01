"""
hello_gemini.py — Day 1 milestone for KinMatch Relational Care Agent.

Proves that:
1. Application Default Credentials (ADC) are working
2. We can call Gemini 3.5 Flash via Vertex AI
3. The agent's Python foundation is operational

Run with: python hello_gemini.py
"""

import os
from google import genai
from google.genai import types

# Vertex AI project config — uses your gcloud ADC credentials
PROJECT_ID = "kinmatch-relational-agent"
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.5-flash"  # Using stable Flash model

# Initialize the client in Vertex AI mode
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION,
)

# A KinMatch-flavored prompt — tests that the model can reason in our brand voice
prompt = """
You are the KinMatch Relational Care Agent. Your job is to help working adults
stay close to the people who matter — without nagging.

Mary hasn't heard from her friend Tomi in 21 days. Tomi is in Mary's inner
circle. Mary tends to send short voice notes on weekday mornings.

In one warm sentence, suggest what Mary might say to Tomi today.
Keep it italic-soft — gentle, present, no marketing-speak.
"""

print("→ Calling Gemini via Vertex AI...")
print(f"  Project: {PROJECT_ID}")
print(f"  Region:  {LOCATION}")
print(f"  Model:   {MODEL_NAME}")
print()

response = client.models.generate_content(
    model=MODEL_NAME,
    contents=prompt,
)

print("← Gemini responded:")
print()
print(response.text)
print()
print("✓ Day 1 foundation is working.")