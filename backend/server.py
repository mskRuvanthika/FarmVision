import base64
import io
import os
import tempfile
import wave
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from pydantic import BaseModel

from inference_sdk import (
    InferenceHTTPClient,
    InferenceConfiguration,
)

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
# APPLICATION
# ============================================================

app = FastAPI(
    title="AI Crop Advisory Backend"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROBOFLOW
# ============================================================

ROBOFLOW_API_KEY = os.getenv(
    "ROBOFLOW_API_KEY"
)

WORKSPACE_NAME = "parkavi-k"

WORKFLOW_ID = (
    "general-segmentation-api-5"
)

DISEASE_CLASSES = (
    "Rust, Bacteria Blights, Brown Spot, "
    "Downey Mildew, Dried Leaves"
)

client = None

if ROBOFLOW_API_KEY:
    client = InferenceHTTPClient(
        api_url="https://serverless.roboflow.com",
        api_key=ROBOFLOW_API_KEY,
    ).configure(
        InferenceConfiguration(
            api_key_transport="header"
        )
    )


# ============================================================
# GEMINI
# ============================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

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
# TTS LANGUAGES
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

def _to_float(value: Any):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_detections(node: Any):
    """
    Best-effort normalization of common
    Roboflow Workflow outputs.
    """

    found = []

    if isinstance(node, dict):

        for key in (
            "predictions",
            "detections",
        ):

            value = node.get(key)

            if isinstance(value, list):

                for item in value:

                    if isinstance(item, dict):

                        label = (
                            item.get("class")
                            or item.get("class_name")
                            or item.get("label")
                            or item.get("name")
                        )

                        confidence = _to_float(
                            item.get("confidence")
                            if "confidence" in item
                            else item.get("score")
                        )

                        if label:

                            found.append(
                                {
                                    "class": str(label),
                                    "confidence": (
                                        confidence
                                        if confidence is not None
                                        else 0.0
                                    ),
                                    "raw": item,
                                }
                            )

        predicted_classes = node.get(
            "predicted_classes"
        )

        if isinstance(
            predicted_classes,
            list,
        ):

            confidences = node.get(
                "predictions"
            )

            for label in predicted_classes:

                confidence = 0.0

                if isinstance(
                    confidences,
                    dict,
                ):

                    value = confidences.get(
                        label
                    )

                    if isinstance(
                        value,
                        dict,
                    ):

                        confidence = (
                            _to_float(
                                value.get(
                                    "confidence"
                                )
                            )
                            or 0.0
                        )

                    else:

                        confidence = (
                            _to_float(
                                value
                            )
                            or 0.0
                        )

                found.append(
                    {
                        "class": str(label),
                        "confidence": confidence,
                        "raw": {
                            "class": label,
                        },
                    }
                )

        for value in node.values():

            if isinstance(
                value,
                (dict, list),
            ):

                found.extend(
                    _extract_detections(
                        value
                    )
                )

    elif isinstance(
        node,
        list,
    ):

        for value in node:

            if isinstance(
                value,
                (dict, list),
            ):

                found.extend(
                    _extract_detections(
                        value
                    )
                )

    return found


def _extract_audio_bytes(response) -> bytes | None:
    """
    Extract PCM audio bytes from Gemini TTS response.
    """

    try:

        candidates = (
            response.candidates
            or []
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


def _pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """
    Gemini TTS returns raw PCM.
    Convert it to WAV for browser playback.
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
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": (
            "AI Crop Advisory backend "
            "is running"
        ),
        "workflow": (
            f"{WORKSPACE_NAME}/"
            f"{WORKFLOW_ID}"
        ),
        "gemini": (
            "configured"
            if gemini_client
            else "not configured"
        ),
        "tts": GEMINI_TTS_MODEL,
    }


# ============================================================
# ROBOFLOW DISEASE DETECTION
# ============================================================

@app.post(
    "/api/disease-detection"
)
async def disease_detection(
    file: UploadFile = File(...),
):

    if client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "ROBOFLOW_API_KEY "
                    "is not configured "
                    "in backend/.env"
                )
            },
        )

    suffix = (
        os.path.splitext(
            file.filename
            or "image.jpg"
        )[1]
        or ".jpg"
    )

    temp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp:

            temp.write(
                await file.read()
            )

            temp_path = temp.name

        result = client.run_workflow(
            workspace_name=WORKSPACE_NAME,
            workflow_id=WORKFLOW_ID,
            images={
                "image": temp_path
            },
            parameters={
                "classes": DISEASE_CLASSES
            },
            use_cache=True,
        )

        detections = (
            _extract_detections(
                result
            )
        )

        unique = {}

        for item in detections:

            key = (
                item["class"],
                round(
                    item["confidence"],
                    6,
                ),
            )

            unique[key] = item

        detections = sorted(
            unique.values(),
            key=lambda x: x[
                "confidence"
            ],
            reverse=True,
        )

        return {
            "success": True,
            "workflow": (
                f"{WORKSPACE_NAME}/"
                f"{WORKFLOW_ID}"
            ),
            "detections": detections,
            "result": result,
        }

    except Exception as exc:

        print(
            "Roboflow workflow error:",
            repr(exc),
        )

        return JSONResponse(
            status_code=502,
            content={
                "detail": (
                    "Roboflow workflow failed: "
                    f"{str(exc)}"
                )
            },
        )

    finally:

        if (
            temp_path
            and os.path.exists(
                temp_path
            )
        ):

            os.remove(
                temp_path
            )


# ============================================================
# GEMINI TEXT ADVICE
# ============================================================

class GeminiAdviceRequest(
    BaseModel
):

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
                    "GEMINI_API_KEY "
                    "is not configured "
                    "in backend/.env"
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

Follow the requested response language
inside the additional context.

For disease or crop-health questions:
1. Explain what it may mean.
2. Explain possible causes.
3. Give management or treatment steps.
4. Give prevention steps.
5. Mention when an agricultural expert
   should be contacted.

Do not invent laboratory results.
Do not claim certainty when information
is uncertain.
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

class GeminiTTSRequest(
    BaseModel
):

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
                    "GEMINI_API_KEY "
                    "is not configured "
                    "in backend/.env"
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

    # Keep very large answers manageable.
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
Read the text exactly as provided.
Use a natural, friendly voice suitable
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

        pcm_bytes = _extract_audio_bytes(
            response
        )

        if not pcm_bytes:

            raise RuntimeError(
                "Gemini TTS did not return audio."
            )

        wav_bytes = _pcm_to_wav(
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
