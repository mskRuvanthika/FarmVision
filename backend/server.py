import base64
import io
import os
import wave
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from google import genai
from google.genai import types


# ============================================================
# ENVIRONMENT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_FILE,
    override=True,
)


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_TEXT_MODEL = os.getenv(
    "GEMINI_TEXT_MODEL",
    "gemini-3.5-flash",
)

GEMINI_TTS_MODEL = os.getenv(
    "GEMINI_TTS_MODEL",
    "gemini-3.1-flash-tts-preview",
)

gemini_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY
    )


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Crop Advisory Gemini Backend"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://mskruvanthika.github.io",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SUPPORTED LANGUAGES
# ============================================================

TTS_LANGUAGES = {
    "en-US": "English",
    "ta-IN": "Tamil",
    "hi-IN": "Hindi",
    "te-IN": "Telugu",
}


# ============================================================
# HELPERS
# ============================================================

def extract_audio_bytes(response) -> bytes | None:
    """
    Extract audio bytes returned by Gemini TTS.
    """

    try:
        candidates = response.candidates or []

        for candidate in candidates:
            content = candidate.content

            if not content:
                continue

            parts = content.parts or []

            for part in parts:
                inline_data = getattr(
                    part,
                    "inline_data",
                    None,
                )

                if inline_data is None:
                    continue

                data = getattr(
                    inline_data,
                    "data",
                    None,
                )

                if not data:
                    continue

                if isinstance(data, str):
                    try:
                        return base64.b64decode(
                            data
                        )
                    except Exception:
                        continue

                return bytes(data)

    except Exception as exc:
        print(
            "Audio extraction error:",
            repr(exc),
        )

    return None


def pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """
    Convert Gemini PCM audio into WAV audio
    that browsers can play.
    """

    buffer = io.BytesIO()

    with wave.open(
        buffer,
        "wb",
    ) as wav_file:

        wav_file.setnchannels(
            channels
        )

        wav_file.setsampwidth(
            sample_width
        )

        wav_file.setframerate(
            sample_rate
        )

        wav_file.writeframes(
            pcm_bytes
        )

    return buffer.getvalue()


# ============================================================
# HOME / HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {
        "message": (
            "AI Crop Advisory Gemini backend "
            "is running"
        ),
        "gemini": (
            "configured"
            if gemini_client
            else "not configured"
        ),
        "text_model": GEMINI_TEXT_MODEL,
        "tts_model": GEMINI_TTS_MODEL,
        "supported_languages": list(
            TTS_LANGUAGES.keys()
        ),
    }


# ============================================================
# GEMINI TEXT ADVICE
# ============================================================

class GeminiAdviceRequest(BaseModel):

    question: str

    disease: str = ""

    crop: str = "Sugarcane"

    context: str = ""


@app.post(
    "/api/gemini-advice"
)
async def gemini_advice(
    request: GeminiAdviceRequest,
):

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "GEMINI_API_KEY is not "
                    "configured in backend/.env"
                )
            },
        )

    prompt = f"""
You are the Farm AI Assistant
for an agriculture application.

Crop:
{request.crop}

Detected disease:
{request.disease}

Additional context:
{request.context}

Farmer's question:
{request.question}

Give practical, simple,
farmer-friendly advice.

Follow the requested language exactly.

If a disease or crop-health problem
is mentioned:

1. Explain what it may mean.
2. Explain possible causes.
3. Give treatment or management steps.
4. Give prevention steps.
5. Mention when the farmer should
   contact an agricultural expert.

Do not invent laboratory results.
Do not claim certainty when the information
is uncertain.

Keep the answer easy to understand.
"""

    try:

        response = (
            gemini_client.models.generate_content(
                model=GEMINI_TEXT_MODEL,
                contents=prompt,
            )
        )

        answer = (
            response.text
            if response.text
            else "I could not generate a response."
        )

        return {
            "success": True,
            "answer": answer,
        }

    except Exception as exc:

        print(
            "Gemini text error:",
            repr(exc),
        )

        return JSONResponse(
            status_code=502,
            content={
                "detail": (
                    "Gemini request failed: "
                    f"{str(exc)}"
                )
            },
        )


# ============================================================
# GEMINI TEXT-TO-SPEECH
# ============================================================

class GeminiTTSRequest(BaseModel):

    text: str

    language: str = "en-US"


@app.post(
    "/api/gemini-tts"
)
async def gemini_tts(
    request: GeminiTTSRequest,
):

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "GEMINI_API_KEY is not "
                    "configured in backend/.env"
                )
            },
        )

    language_code = request.language

    if language_code not in TTS_LANGUAGES:
        language_code = "en-US"

    language_name = TTS_LANGUAGES[
        language_code
    ]

    text = request.text.strip()

    if not text:

        return JSONResponse(
            status_code=400,
            content={
                "detail": (
                    "No text was provided "
                    "for speech."
                )
            },
        )

    # Prevent extremely large TTS requests.
    text = text[:6000]

    tts_prompt = f"""
Read the following text aloud naturally.

Language:
{language_name}

Language code:
{language_code}

IMPORTANT:
Speak in {language_name}.
Do not translate the text.
Read the provided text naturally.
Use a clear and friendly voice suitable
for an agriculture assistant helping farmers.

Text:
{text}
"""

    try:

        response = (
            gemini_client.models.generate_content(
                model=GEMINI_TTS_MODEL,
                contents=tts_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=[
                        "AUDIO"
                    ],
                    speech_config=types.SpeechConfig(
                        language_code=language_code,
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=(
                                types.PrebuiltVoiceConfig(
                                    voice_name="Kore"
                                )
                            )
                        ),
                    ),
                ),
            )
        )

        pcm_bytes = extract_audio_bytes(
            response
        )

        if not pcm_bytes:

            raise RuntimeError(
                "Gemini TTS did not return audio."
            )

        wav_bytes = pcm_to_wav(
            pcm_bytes
        )

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Cache-Control": "no-cache",
            },
        )

    except Exception as exc:

        print(
            "Gemini TTS error:",
            repr(exc),
        )

        return JSONResponse(
            status_code=502,
            content={
                "detail": (
                    "Gemini TTS request failed: "
                    f"{str(exc)}"
                )
            },
        )


# ============================================================
# RUN WITH:
#
# uvicorn server:app --host 0.0.0.0 --port 8001
# ============================================================
