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
# LOAD ENVIRONMENT VARIABLES
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

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

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
# SUPPORTED LANGUAGES
# ============================================================

SUPPORTED_LANGUAGES = {
    "en-US": "English",
    "ta-IN": "Tamil",
    "hi-IN": "Hindi",
    "te-IN": "Telugu",
}


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="FarmVision Gemini Backend"
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
# AUDIO HELPERS
# ============================================================

def extract_audio_bytes(
    response
) -> bytes | None:
    """
    Extract PCM audio bytes from Gemini response.
    """

    try:

        candidates = (
            response.candidates or []
        )

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

                if not inline_data:
                    continue

                data = getattr(
                    inline_data,
                    "data",
                    None,
                )

                if not data:
                    continue

                if isinstance(
                    data,
                    str,
                ):

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
    Convert Gemini PCM audio to WAV.
    """

    output = io.BytesIO()

    with wave.open(
        output,
        "wb",
    ) as wav:

        wav.setnchannels(
            channels
        )

        wav.setsampwidth(
            sample_width
        )

        wav.setframerate(
            sample_rate
        )

        wav.writeframes(
            pcm_bytes
        )

    return output.getvalue()


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {
        "message": "FarmVision Gemini backend is running",

        "gemini": (
            "configured"
            if gemini_client
            else "not configured"
        ),

        "text_model":
            GEMINI_TEXT_MODEL,

        "tts_model":
            GEMINI_TTS_MODEL,

        "languages":
            list(
                SUPPORTED_LANGUAGES.keys()
            ),
    }


# ============================================================
# GEMINI TEXT REQUEST
# ============================================================

class GeminiAdviceRequest(
    BaseModel
):

    question: str

    disease: str = ""

    crop: str = "Sugarcane"

    context: str = ""

    language: str = "en-US"


@app.post(
    "/api/gemini-advice"
)
async def gemini_advice(
    request: GeminiAdviceRequest
):

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail":
                    "GEMINI_API_KEY is not configured."
            },
        )


    language = request.language

    if language not in SUPPORTED_LANGUAGES:

        language = "en-US"


    language_name = (
        SUPPORTED_LANGUAGES[
            language
        ]
    )


    prompt = f"""
You are FarmVision's AI agricultural
assistant helping farmers.

Crop:
{request.crop}

Detected disease:
{request.disease}

Farmer question:
{request.question}

Additional context:
{request.context}

IMPORTANT LANGUAGE REQUIREMENT:

Reply ONLY in {language_name}.

Do not answer in English unless
the selected language is English.

Use simple, natural, farmer-friendly
language.

For crop or disease questions:

1. Explain the problem.
2. Explain possible causes.
3. Give practical treatment or
   management steps.
4. Give prevention steps.
5. Mention when an agricultural
   expert should be contacted.

Do not invent laboratory results.
Do not claim certainty when the
information is uncertain.
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
            "language": language,
            "language_name": language_name,
        }


    except Exception as exc:

        print(
            "Gemini text error:",
            repr(exc),
        )


        return JSONResponse(
            status_code=502,
            content={
                "detail":
                    f"Gemini request failed: {str(exc)}"
            },
        )


# ============================================================
# GEMINI TEXT-TO-SPEECH REQUEST
# ============================================================

class GeminiTTSRequest(
    BaseModel
):

    text: str

    language: str = "en-US"


@app.post(
    "/api/gemini-tts"
)
async def gemini_tts(
    request: GeminiTTSRequest
):

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail":
                    "GEMINI_API_KEY is not configured."
            },
        )


    language = request.language

    if language not in SUPPORTED_LANGUAGES:

        language = "en-US"


    language_name = (
        SUPPORTED_LANGUAGES[
            language
        ]
    )


    text = request.text.strip()


    if not text:

        return JSONResponse(
            status_code=400,
            content={
                "detail":
                    "Text is required."
            },
        )


    # Prevent excessively large TTS requests.
    text = text[:6000]


    tts_prompt = f"""
Speak the following text naturally.

Selected language:
{language_name}

Language code:
{language}

IMPORTANT:
Speak ONLY in {language_name}.

Do not translate the text into another
language.

Read the text naturally and clearly,
with a friendly voice suitable for a
farmer assistance application.

Text to speak:
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
                        language_code=language,
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


        pcm_audio = extract_audio_bytes(
            response
        )


        if not pcm_audio:

            raise RuntimeError(
                "Gemini TTS returned no audio."
            )


        wav_audio = pcm_to_wav(
            pcm_audio
        )


        return Response(
            content=wav_audio,
            media_type="audio/wav",
            headers={
                "Cache-Control":
                    "no-cache, no-store",
                "Pragma":
                    "no-cache",
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
                "detail":
                    f"Gemini TTS failed: {str(exc)}"
            },
        )
