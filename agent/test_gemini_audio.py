"""
Standalone test of Gemini Audio transcription on Vertex AI.
"""
import os
import sys
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

PROJECT_ID = "kinmatch-relational-agent"
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.5-flash"


def transcribe_audio_file(audio_file_path: str) -> str:
    print(f"Transcribing: {audio_file_path}")
    print(f"File size: {os.path.getsize(audio_file_path)} bytes")

    with open(audio_file_path, "rb") as f:
        audio_bytes = f.read()

    ext = audio_file_path.lower().split(".")[-1]
    mime_map = {
        "mp3": "audio/mpeg",
        "wav": "audio/wav",
        "m4a": "audio/mp4",
        "webm": "audio/webm",
        "ogg": "audio/ogg",
    }
    mime_type = mime_map.get(ext, "audio/mpeg")
    print(f"Detected mime type: {mime_type}")

    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )

    audio_part = types.Part.from_bytes(
        data=audio_bytes,
        mime_type=mime_type,
    )

    prompt = (
        "Transcribe this audio accurately. "
        "Return only the transcript text, no commentary or timestamps."
    )

    print("Sending to Gemini 2.5 Flash...")
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[prompt, audio_part],
    )

    return response.text


if __name__ == "__main__":
    print("Script starting...")

    if len(sys.argv) < 2:
        print("Usage: python test_gemini_audio.py <path_to_audio_file>")
        sys.exit(1)

    audio_path = sys.argv[1]
    print(f"Audio path argument: {audio_path}")

    if not os.path.exists(audio_path):
        print(f"File not found: {audio_path}")
        sys.exit(1)

    try:
        transcript = transcribe_audio_file(audio_path)
        print("")
        print("=" * 60)
        print("TRANSCRIPT:")
        print("=" * 60)
        print(transcript)
        print("=" * 60)
    except Exception as e:
        print(f"")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
