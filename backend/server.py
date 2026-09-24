import asyncio
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


# ============================================================
# ENVIRONMENT
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_FILE,
    override=False,
)


# ============================================================
# GEMINI CONFIGURATION
# ============================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Current stable Gemini text model
GEMINI_TEXT_MODEL = os.getenv(
    "GEMINI_TEXT_MODEL",
    "gemini-3.8-flash",
)

# Current stable Gemini TTS model
GEMINI_TTS_MODEL = os.getenv(
    "GEMINI_TTS_MODEL",
    "gemini-3.8-flash-tts",
)


# ============================================================
# GEMINI CLIENT
# ============================================================

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
    title="FarmVision Gemini Backend",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

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
# GEMINI TEXT MODEL FALLBACKS
# ============================================================

def get_text_models():
    """
    Returns the configured Gemini model followed by
    currently available fallback models.

    Duplicates are removed.
    """

    models = [
        GEMINI_TEXT_MODEL,
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
    ]

    unique_models = []

    for model in models:
        if model and model not in unique_models:
            unique_models.append(model)

    return unique_models


# ============================================================
# GEMINI TEXT GENERATION
# ============================================================

async def generate_gemini_text(prompt: str):
    """
    Generate Gemini text with retry and fallback support.

    Returns:
        response, model_used
    """

    if gemini_client is None:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    last_error = None

    for model in get_text_models():

        # Maximum 3 attempts for temporary failures
        for attempt in range(3):

            try:
                print(
                    f"Gemini text request: "
                    f"model={model}, "
                    f"attempt={attempt + 1}"
                )

                response = (
                    gemini_client.models.generate_content(
                        model=model,
                        contents=prompt,
                    )
                )

                return response, model

            except Exception as exc:

                last_error = exc
                error_text = str(exc)

                print(
                    f"Gemini text error "
                    f"(model={model}, "
                    f"attempt={attempt + 1}): "
                    f"{error_text}"
                )

                # Temporary server overload
                if (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                ):

                    if attempt < 2:
                        delay = 2 ** attempt

                        print(
                            f"Retrying after {delay} seconds..."
                        )

                        await asyncio.sleep(delay)
                        continue

                    # Move to next fallback model
                    break

                # Rate limit / resource exhausted
                if (
                    "429" in error_text
                    or "RESOURCE_EXHAUSTED"
                    in error_text
                ):

                    # One short retry, then move to fallback
                    if attempt == 0:
                        await asyncio.sleep(2)
                        continue

                    break

                # Other errors:
                # move immediately to fallback model
                break

    raise RuntimeError(
        "All Gemini text models failed: "
        f"{last_error}"
    )


# ============================================================
# PCM AUDIO -> WAV
# ============================================================

def pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """
    Gemini TTS returns PCM audio.

    Convert PCM audio into WAV so that the browser
    can play it easily.
    """

    output = io.BytesIO()

    with wave.open(output, "wb") as wav:

        wav.setnchannels(channels)
        wav.setsampwidth(sample_width)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm_bytes)

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

        "text_model": GEMINI_TEXT_MODEL,

        "text_fallbacks": get_text_models()[1:],

        "tts_model": GEMINI_TTS_MODEL,

        "languages": list(
            SUPPORTED_LANGUAGES.keys()
        ),
    }


# ============================================================
# GEMINI ADVICE REQUEST
# ============================================================

class GeminiAdviceRequest(BaseModel):

    question: str

    disease: str = ""

    crop: str = "Sugarcane"

    context: str = ""

    language: str = "en-US"


# ============================================================
# GEMINI AGRICULTURAL ADVICE
# ============================================================

@app.post("/api/gemini-advice")
async def gemini_advice(
    request: GeminiAdviceRequest,
):

    # --------------------------------------------------------
    # Check Gemini configuration
    # --------------------------------------------------------

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "GEMINI_API_KEY "
                    "is not configured."
                )
            },
        )

    # --------------------------------------------------------
    # Validate language
    # --------------------------------------------------------

    language = request.language

    if language not in SUPPORTED_LANGUAGES:
        language = "en-US"

    language_name = (
        SUPPORTED_LANGUAGES[language]
    )

    # --------------------------------------------------------
    # Build agricultural prompt
    # --------------------------------------------------------

    prompt = f"""
You are FarmVision's AI agricultural assistant.

You help farmers understand crop, soil and disease-related
information in simple and practical language.

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

Do not answer in English unless the selected language is English.

Use simple, natural and farmer-friendly language.

For crop or disease questions:

1. Explain the problem clearly.
2. Explain possible causes.
3. Give practical treatment or management steps.
4. Give prevention steps.
5. Mention when an agricultural expert should be contacted.

Do not invent laboratory results.

Do not claim certainty when the information is uncertain.

Do not pretend that an AI prediction is a confirmed
professional diagnosis.

Keep the response useful and practical for a farmer.
""".strip()

    # --------------------------------------------------------
    # Generate response
    # --------------------------------------------------------

    try:

        response, used_model = (
            await generate_gemini_text(
                prompt
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
            "model": used_model,
        }

    except Exception as exc:

        error_text = str(exc)

        print(
            "Final Gemini text error:",
            repr(exc),
        )

        # ----------------------------------------------------
        # HTTP status
        # ----------------------------------------------------

        if (
            "429" in error_text
            or "RESOURCE_EXHAUSTED"
            in error_text
        ):

            status_code = 429

        elif (
            "503" in error_text
            or "UNAVAILABLE" in error_text
        ):

            status_code = 503

        else:

            status_code = 502

        return JSONResponse(
            status_code=status_code,
            content={
                "detail": (
                    "Gemini request failed: "
                    f"{error_text}"
                )
            },
        )


# ============================================================
# GEMINI TTS REQUEST
# ============================================================

class GeminiTTSRequest(BaseModel):

    text: str

    language: str = "en-US"


# ============================================================
# GEMINI TEXT-TO-SPEECH
# ============================================================

@app.post("/api/gemini-tts")
async def gemini_tts(
    request: GeminiTTSRequest,
):

    # --------------------------------------------------------
    # Check Gemini configuration
    # --------------------------------------------------------

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "GEMINI_API_KEY "
                    "is not configured."
                )
            },
        )

    # --------------------------------------------------------
    # Validate language
    # --------------------------------------------------------

    language = request.language

    if language not in SUPPORTED_LANGUAGES:
        language = "en-US"

    language_name = (
        SUPPORTED_LANGUAGES[language]
    )

    # --------------------------------------------------------
    # Validate text
    # --------------------------------------------------------

    text = request.text.strip()

    if not text:

        return JSONResponse(
            status_code=400,
            content={
                "detail": "Text is required."
            },
        )

    # Prevent excessively large TTS requests
    text = text[:6000]

    # --------------------------------------------------------
    # TTS prompt
    # --------------------------------------------------------

    tts_prompt = f"""
Read the following text aloud naturally.

Selected language:
{language_name}

Language code:
{language}

IMPORTANT:

Speak only in {language_name}.

Do not translate the text.

Do not change the meaning.

Read the transcript clearly and naturally.

Use a friendly and clear voice suitable for
a farmer assistance application.

Transcript:

{text}
""".strip()

    # --------------------------------------------------------
    # TTS retry
    # --------------------------------------------------------

    last_error = None

    for attempt in range(3):

        try:

            print(
                f"Gemini TTS request: "
                f"model={GEMINI_TTS_MODEL}, "
                f"language={language}, "
                f"attempt={attempt + 1}"
            )

            interaction = (
                gemini_client.interactions.create(
                    model=GEMINI_TTS_MODEL,

                    input=tts_prompt,

                    response_format={
                        "type": "audio"
                    },

                    generation_config={
                        "speech_config": [
                            {
                                "voice": "Kore"
                            }
                        ]
                    },
                )
            )

            # ------------------------------------------------
            # Extract audio
            # ------------------------------------------------

            output_audio = getattr(
                interaction,
                "output_audio",
                None,
            )

            if not output_audio:

                raise RuntimeError(
                    "Gemini TTS returned no audio."
                )

            audio_data = getattr(
                output_audio,
                "data",
                None,
            )

            if not audio_data:

                raise RuntimeError(
                    "Gemini TTS returned "
                    "empty audio data."
                )

            # ------------------------------------------------
            # Decode base64 audio
            # ------------------------------------------------

            if isinstance(
                audio_data,
                str,
            ):

                pcm_audio = base64.b64decode(
                    audio_data
                )

            else:

                pcm_audio = bytes(
                    audio_data
                )

            # ------------------------------------------------
            # Convert PCM -> WAV
            # ------------------------------------------------

            wav_audio = pcm_to_wav(
                pcm_audio
            )

            # ------------------------------------------------
            # Return browser-compatible WAV
            # ------------------------------------------------

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

            last_error = exc

            error_text = str(exc)

            print(
                f"Gemini TTS attempt "
                f"{attempt + 1} failed: "
                f"{error_text}"
            )

            # ------------------------------------------------
            # Retry temporary overload
            # ------------------------------------------------

            if (
                "503" in error_text
                or "UNAVAILABLE"
                in error_text
            ):

                if attempt < 2:

                    delay = 2 ** attempt

                    print(
                        f"TTS retrying after "
                        f"{delay} seconds..."
                    )

                    await asyncio.sleep(
                        delay
                    )

                    continue

            # ------------------------------------------------
            # Retry rate limit once
            # ------------------------------------------------

            if (
                "429" in error_text
                or "RESOURCE_EXHAUSTED"
                in error_text
            ):

                if attempt == 0:

                    await asyncio.sleep(2)

                    continue

            break

    # ========================================================
    # TTS FAILED
    # ========================================================

    error_text = str(last_error)

    if (
        "429" in error_text
        or "RESOURCE_EXHAUSTED"
        in error_text
    ):

        status_code = 429

    elif (
        "503" in error_text
        or "UNAVAILABLE"
        in error_text
    ):

        status_code = 503

    else:

        status_code = 502

    return JSONResponse(
        status_code=status_code,
        content={
            "detail": (
                "Gemini TTS failed: "
                f"{error_text}"
            )
        },
    )


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=int(
            os.getenv("PORT", "8000")
        ),
        reload=False,
    )
