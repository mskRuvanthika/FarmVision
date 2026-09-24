import asyncio
import base64
import io
import json
import tensorflow as tf
import numpy as np
import os
import wave

from pathlib import Path

from PIL import Image
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from pydantic import BaseModel

from google import genai
from huggingface_hub import snapshot_download


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

GEMINI_TEXT_MODEL = os.getenv(
    "GEMINI_TEXT_MODEL",
    "gemini-3.6-flash",
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


# ============================================================
# DISEASE MODEL
# ============================================================

MODEL_PATH = BASE_DIR / "tomato_disease_model.keras"
LABELS_PATH = BASE_DIR / "class_labels.json"

HF_REPO = "Ruvanthika18/tomato-disease-model"

disease_model = None
CLASS_LABELS = {}


def load_disease_model():
    global disease_model, CLASS_LABELS

    if not MODEL_PATH.exists() or not LABELS_PATH.exists():

        snapshot_download(
            repo_id=HF_REPO,
            local_dir=BASE_DIR,
            allow_patterns=[
                "tomato_disease_model.keras",
                "class_labels.json",
            ],
        )

    disease_model = tf.keras.models.load_model(
        MODEL_PATH
    )

    with open(
        LABELS_PATH,
        "r",
        encoding="utf-8"
    ) as f:
        CLASS_LABELS = json.load(f)

    print("Disease model loaded successfully.")


load_disease_model()


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
# HELPER: TEXT MODELS
# ============================================================

def get_text_models():

    models = [
        GEMINI_TEXT_MODEL,
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
    ]

    unique_models = []

    for model in models:

        if model and model not in unique_models:
            unique_models.append(model)

    return unique_models


# ============================================================
# HELPER: GENERATE GEMINI TEXT
# ============================================================

async def generate_gemini_text(prompt: str):

    last_error = None

    for model in get_text_models():

        for attempt in range(3):

            try:

                print(
                    f"Gemini text attempt: "
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

                if (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                ):

                    if attempt < 2:

                        await asyncio.sleep(
                            2 ** attempt
                        )

                        continue

                break

    raise RuntimeError(
        "All Gemini text models failed: "
        f"{last_error}"
    )


# ============================================================
# HELPER: PCM -> WAV
# ============================================================

def pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:

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
# DISEASE DETECTION
# ============================================================

@app.post("/predict")
async def predict_disease(
    file: UploadFile = File(...)
):

    try:

        # Read uploaded image
        image_bytes = await file.read()

        # Open image
        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        # Resize for MobileNetV2
        image = image.resize(
            (224, 224)
        )

        # Convert image to NumPy array
        image_array = np.array(
            image
        )

        # MobileNetV2 preprocessing
        image_array = (
            tf.keras.applications
            .mobilenet_v2
            .preprocess_input(
                image_array
            )
        )

        # Add batch dimension
        image_array = np.expand_dims(
            image_array,
            axis=0
        )

        # Run prediction
        predictions = (
            disease_model.predict(
                image_array,
                verbose=0
            )[0]
        )

        # Get predicted class
        predicted_index = int(
            np.argmax(predictions)
        )

        # Get confidence
        confidence = float(
            predictions[predicted_index]
        )

        # Get disease name safely
        disease = CLASS_LABELS.get(
            str(predicted_index),
            f"Unknown disease (class {predicted_index})"
        )

        return {

            "success": True,

            "disease": disease,

            "confidence": confidence,

            "confidence_percent": round(
                confidence * 100,
                2
            ),
        }

    except Exception as exc:

        print(
            "Disease prediction error:",
            repr(exc)
        )

        return JSONResponse(

            status_code=500,

            content={
                "success": False,
                "detail": str(exc),
            },
        )


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
# GEMINI ADVICE
# ============================================================

@app.post("/api/gemini-advice")
async def gemini_advice(
    request: GeminiAdviceRequest,
):

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

    language = request.language

    if language not in SUPPORTED_LANGUAGES:

        language = "en-US"

    language_name = (
        SUPPORTED_LANGUAGES[language]
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

Use simple, natural,
farmer-friendly language.

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
""".strip()

    try:

        response, used_model = (
            await generate_gemini_text(
                prompt
            )
        )

        answer = (
            response.text
            if response.text
            else (
                "I could not generate "
                "a response."
            )
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
# GEMINI TTS
# ============================================================

@app.post("/api/gemini-tts")
async def gemini_tts(
    request: GeminiTTSRequest,
):

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

    language = request.language

    if language not in SUPPORTED_LANGUAGES:

        language = "en-US"

    language_name = (
        SUPPORTED_LANGUAGES[language]
    )

    text = request.text.strip()

    if not text:

        return JSONResponse(

            status_code=400,

            content={
                "detail": "Text is required."
            },
        )

    # Keep TTS requests reasonably sized
    text = text[:6000]

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
Use a friendly voice suitable for a
farmer assistance application.

Transcript:
{text}
""".strip()

    last_error = None

    # Retry temporary TTS failures
    for attempt in range(3):

        try:

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

            if isinstance(
                audio_data,
                str,
            ):

                pcm_audio = (
                    base64.b64decode(
                        audio_data
                    )
                )

            else:

                pcm_audio = bytes(
                    audio_data
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

            last_error = exc

            error_text = str(exc)

            print(
                f"Gemini TTS attempt "
                f"{attempt + 1} failed: "
                f"{error_text}"
            )

            if (
                "503" in error_text
                or "UNAVAILABLE"
                in error_text
            ):

                if attempt < 2:

                    await asyncio.sleep(
                        2 ** attempt
                    )

                    continue

            break

    error_text = str(
        last_error
    )

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
