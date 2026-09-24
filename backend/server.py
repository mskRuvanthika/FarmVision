import asyncio
import base64
import io
import json
import os
import wave
from pathlib import Path

import numpy as np
import requests
import tensorflow as tf

from PIL import Image
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException
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
# ROBOFLOW CONFIGURATION
# ============================================================

SOIL_ROBOFLOW_MODEL = "soil-type-ladmq/6"

ROBOFLOW_API_KEY = os.getenv(
    "ROBOFLOW_API_KEY"
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
    title="FarmVision Backend"
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
        "https://farmvision-60088588626.development.catalystserverless.in",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DISEASE MODEL
# ============================================================

MODEL_PATH = (
    BASE_DIR / "tomato_disease_model.keras"
)

LABELS_PATH = (
    BASE_DIR / "class_labels.json"
)

HF_REPO = (
    "Ruvanthika18/tomato-disease-model"
)

disease_model = None
CLASS_LABELS = {}


def load_disease_model():

    global disease_model
    global CLASS_LABELS

    if (
        not MODEL_PATH.exists()
        or not LABELS_PATH.exists()
    ):

        print(
            "Downloading disease model "
            "from Hugging Face..."
        )

        snapshot_download(
            repo_id=HF_REPO,
            local_dir=BASE_DIR,
            allow_patterns=[
                "tomato_disease_model.keras",
                "class_labels.json",
            ],
        )

    if (
        not MODEL_PATH.exists()
        or not LABELS_PATH.exists()
    ):

        raise FileNotFoundError(
            "Disease model files are missing."
        )

    disease_model = (
        tf.keras.models.load_model(
            MODEL_PATH
        )
    )

    with open(
        LABELS_PATH,
        "r",
        encoding="utf-8"
    ) as f:

        CLASS_LABELS = json.load(f)

    print(
        "Disease model loaded successfully."
    )


load_disease_model()


# ============================================================
# DISEASE INFORMATION
# ============================================================

DISEASE_INFO = {

    "Bacterial spot": {
        "nameHindi": "जीवाणु धब्बा रोग",
        "severity": "High",
        "description":
            "A bacterial disease that causes dark "
            "water-soaked or necrotic spots on "
            "tomato leaves and fruit.",
        "descriptionHindi":
            "जीवाणु रोग जो टमाटर की पत्तियों और "
            "फलों पर गहरे धब्बे पैदा करता है।",
        "treatment": [
            "Remove severely infected leaves",
            "Avoid overhead irrigation",
            "Improve air circulation and spacing",
            "Use an appropriate copper-based bactericide "
            "only as locally recommended",
        ],
        "treatmentHindi": [
            "बहुत संक्रमित पत्तियां हटाएं",
            "ऊपर से सिंचाई से बचें",
            "पौधों के बीच उचित दूरी रखें",
            "स्थानीय सलाह के अनुसार उपयुक्त कॉपर "
            "आधारित जीवाणुनाशी का उपयोग करें",
        ],
    },

    "Early blight": {
        "nameHindi": "अर्ली ब्लाइट",
        "severity": "Moderate",
        "description":
            "A fungal disease commonly producing "
            "brown concentric-ring lesions on "
            "older tomato leaves.",
        "descriptionHindi":
            "एक फफूंद रोग जिसमें पुरानी टमाटर की "
            "पत्तियों पर भूरे गोलाकार धब्बे बन सकते हैं।",
        "treatment": [
            "Remove infected lower leaves",
            "Keep foliage dry when possible",
            "Improve plant spacing and airflow",
            "Use a locally recommended fungicide "
            "when necessary",
        ],
        "treatmentHindi": [
            "संक्रमित निचली पत्तियां हटाएं",
            "पत्तियों को यथासंभव सूखा रखें",
            "पौधों में हवा का संचार बढ़ाएं",
            "आवश्यकता पर स्थानीय सलाह के अनुसार "
            "कवकनाशी उपयोग करें",
        ],
    },

    "Late blight": {
        "nameHindi": "लेट ब्लाइट",
        "severity": "High",
        "description":
            "A destructive disease that can cause "
            "dark, rapidly expanding lesions on "
            "tomato foliage.",
        "descriptionHindi":
            "एक गंभीर रोग जो टमाटर की पत्तियों पर "
            "तेजी से फैलने वाले गहरे धब्बे पैदा कर सकता है।",
        "treatment": [
            "Remove affected plant material promptly",
            "Avoid prolonged leaf wetness",
            "Improve airflow and field sanitation",
            "Use a locally recommended fungicide "
            "program when confirmed",
        ],
        "treatmentHindi": [
            "संक्रमित पौध सामग्री तुरंत हटाएं",
            "पत्तियों पर लंबे समय तक नमी न रहने दें",
            "हवा का संचार और खेत की स्वच्छता सुधारें",
            "पुष्टि होने पर स्थानीय सलाह के अनुसार "
            "कवकनाशी कार्यक्रम अपनाएं",
        ],
    },

    "Leaf Mold": {
        "nameHindi": "लीफ मोल्ड",
        "severity": "Moderate",
        "description":
            "A fungal disease associated with humid "
            "conditions, often producing yellow areas "
            "and mold growth on leaf undersides.",
        "descriptionHindi":
            "नमी वाली परिस्थितियों से जुड़ा फफूंद रोग, "
            "जिसमें पत्तियों पर पीले क्षेत्र और नीचे की "
            "ओर फफूंद दिखाई दे सकती है।",
        "treatment": [
            "Reduce humidity around foliage",
            "Improve ventilation",
            "Remove affected leaves",
            "Use locally recommended fungicide if needed",
        ],
        "treatmentHindi": [
            "पत्तियों के आसपास नमी कम करें",
            "हवादारी बढ़ाएं",
            "संक्रमित पत्तियां हटाएं",
            "आवश्यकता पर स्थानीय सलाह के अनुसार "
            "कवकनाशी उपयोग करें",
        ],
    },

    "Septoria leaf spot": {
        "nameHindi": "सेप्टोरिया लीफ स्पॉट",
        "severity": "Moderate",
        "description":
            "A fungal leaf-spot disease that can cause "
            "numerous small circular lesions on "
            "tomato foliage.",
        "descriptionHindi":
            "एक फफूंद रोग जिसमें टमाटर की पत्तियों पर "
            "कई छोटे गोल धब्बे बन सकते हैं।",
        "treatment": [
            "Remove infected lower leaves",
            "Avoid splashing water onto foliage",
            "Improve spacing and sanitation",
            "Use a locally recommended fungicide "
            "when necessary",
        ],
        "treatmentHindi": [
            "संक्रमित निचली पत्तियां हटाएं",
            "पत्तियों पर पानी के छींटों से बचें",
            "दूरी और स्वच्छता सुधारें",
            "आवश्यकता पर स्थानीय सलाह के अनुसार "
            "कवकनाशी उपयोग करें",
        ],
    },

    "Spider mites Two-spotted spider mite": {
        "nameHindi": "स्पाइडर माइट",
        "severity": "Moderate",
        "description":
            "A mite pest that can cause stippling, "
            "yellowing and webbing on tomato leaves, "
            "especially under hot dry conditions.",
        "descriptionHindi":
            "एक कीट जो विशेषकर गर्म और शुष्क "
            "परिस्थितियों में पत्तियों पर पीलेपन, "
            "बारीक धब्बों और जाले का कारण बन सकता है।",
        "treatment": [
            "Inspect leaf undersides",
            "Use water spray to reduce dust and mites "
            "where appropriate",
            "Encourage beneficial predators",
            "Use an appropriate miticide only when "
            "needed and according to its label",
        ],
        "treatmentHindi": [
            "पत्तियों की निचली सतह जांचें",
            "उचित होने पर पानी का छिड़काव करें",
            "लाभकारी प्राकृतिक शत्रुओं को सुरक्षित रखें",
            "जरूरत पर लेबल के अनुसार उपयुक्त "
            "माइटनाशी का उपयोग करें",
        ],
    },

    "Target Spot": {
        "nameHindi": "टार्गेट स्पॉट",
        "severity": "Moderate",
        "description":
            "A fungal disease producing circular "
            "brown lesions that may develop a "
            "target-like pattern.",
        "descriptionHindi":
            "एक फफूंद रोग जिसमें गोल भूरे धब्बे बन "
            "सकते हैं और लक्ष्य जैसे छल्ले दिखाई दे सकते हैं।",
        "treatment": [
            "Remove heavily affected leaves",
            "Improve air circulation",
            "Avoid prolonged leaf wetness",
            "Use locally recommended fungicide "
            "when necessary",
        ],
        "treatmentHindi": [
            "बहुत संक्रमित पत्तियां हटाएं",
            "हवा का संचार बढ़ाएं",
            "पत्तियों पर लंबे समय तक नमी से बचें",
            "आवश्यकता पर स्थानीय सलाह के अनुसार "
            "कवकनाशी उपयोग करें",
        ],
    },

    "Tomato Yellow Leaf Curl Virus": {
        "nameHindi": "टमाटर येलो लीफ कर्ल वायरस",
        "severity": "High",
        "description":
            "A viral disease often associated with "
            "leaf curling, yellowing and stunted "
            "plant growth.",
        "descriptionHindi":
            "एक वायरल रोग जिसमें पत्तियां मुड़ सकती हैं, "
            "पीली पड़ सकती हैं और पौधे की वृद्धि रुक सकती है।",
        "treatment": [
            "Remove severely affected plants "
            "when appropriate",
            "Control whitefly vectors",
            "Remove weed hosts around the crop",
            "Use healthy seedlings and resistant "
            "varieties where available",
        ],
        "treatmentHindi": [
            "उचित होने पर बहुत संक्रमित पौधे हटाएं",
            "सफेद मक्खी का नियंत्रण करें",
            "फसल के आसपास खरपतवार हटाएं",
            "जहां उपलब्ध हो स्वस्थ पौधे और प्रतिरोधी "
            "किस्में उपयोग करें",
        ],
    },

    "Tomato mosaic virus": {
        "nameHindi": "टमाटर मोज़ेक वायरस",
        "severity": "High",
        "description":
            "A viral disease that can cause mottled "
            "or mosaic leaf patterns and reduced "
            "plant growth.",
        "descriptionHindi":
            "एक वायरल रोग जिसमें पत्तियों पर मोज़ेक "
            "जैसे पैटर्न और पौधे की वृद्धि में कमी हो सकती है।",
        "treatment": [
            "Remove infected plants or tissues "
            "where appropriate",
            "Disinfect tools and hands after "
            "handling plants",
            "Avoid tobacco contamination during handling",
            "Use certified healthy seed or seedlings",
        ],
        "treatmentHindi": [
            "उचित होने पर संक्रमित पौधे या भाग हटाएं",
            "पौधों को संभालने के बाद औजार और हाथ साफ करें",
            "पौधों को संभालते समय तंबाकू से दूषण से बचें",
            "प्रमाणित स्वस्थ बीज या पौध उपयोग करें",
        ],
    },

    "healthy": {
        "nameHindi": "स्वस्थ पत्ता",
        "severity": "Low",
        "description":
            "No visible disease pattern was detected "
            "by the model in this image.",
        "descriptionHindi":
            "इस छवि में मॉडल ने रोग का स्पष्ट "
            "पैटर्न नहीं पाया।",
        "treatment": [
            "Continue regular crop monitoring",
            "Maintain good spacing and airflow",
            "Water appropriately and avoid "
            "unnecessary leaf wetness",
            "Inspect plants regularly for new symptoms",
        ],
        "treatmentHindi": [
            "फसल की नियमित निगरानी जारी रखें",
            "उचित दूरी और हवा का संचार बनाए रखें",
            "उचित सिंचाई करें और अनावश्यक पत्ती "
            "नमी से बचें",
            "नए लक्षणों के लिए पौधों की नियमित जांच करें",
        ],
    },
}


# ============================================================
# SOIL PARAMETER ENGINE
# ============================================================

SOIL_PARAMETER_ENGINE = {

    "alluvial": {
        "nitrogen": {"value": 140, "unit": "kg/ha"},
        "phosphorus": {"value": 18, "unit": "mg/kg"},
        "potassium": {"value": 180, "unit": "kg/ha"},
        "pH": {"value": 7.0, "unit": ""},
        "organic_carbon": {"value": 0.65, "unit": "%"},
    },

    "black": {
        "nitrogen": {"value": 150, "unit": "kg/ha"},
        "phosphorus": {"value": 12, "unit": "mg/kg"},
        "potassium": {"value": 300, "unit": "kg/ha"},
        "pH": {"value": 7.2, "unit": ""},
        "organic_carbon": {"value": 0.75, "unit": "%"},
    },

    "cinder": {
        "nitrogen": {"value": 80, "unit": "kg/ha"},
        "phosphorus": {"value": 10, "unit": "mg/kg"},
        "potassium": {"value": 120, "unit": "kg/ha"},
        "pH": {"value": 6.5, "unit": ""},
        "organic_carbon": {"value": 0.40, "unit": "%"},
    },

    "clay": {
        "nitrogen": {"value": 130, "unit": "kg/ha"},
        "phosphorus": {"value": 15, "unit": "mg/kg"},
        "potassium": {"value": 220, "unit": "kg/ha"},
        "pH": {"value": 7.0, "unit": ""},
        "organic_carbon": {"value": 0.60, "unit": "%"},
    },

    "laterite": {
        "nitrogen": {"value": 90, "unit": "kg/ha"},
        "phosphorus": {"value": 8, "unit": "mg/kg"},
        "potassium": {"value": 110, "unit": "kg/ha"},
        "pH": {"value": 5.8, "unit": ""},
        "organic_carbon": {"value": 0.55, "unit": "%"},
    },

    "loamy": {
        "nitrogen": {"value": 160, "unit": "kg/ha"},
        "phosphorus": {"value": 20, "unit": "mg/kg"},
        "potassium": {"value": 200, "unit": "kg/ha"},
        "pH": {"value": 6.8, "unit": ""},
        "organic_carbon": {"value": 0.80, "unit": "%"},
    },

    "peat": {
        "nitrogen": {"value": 200, "unit": "kg/ha"},
        "phosphorus": {"value": 15, "unit": "mg/kg"},
        "potassium": {"value": 100, "unit": "kg/ha"},
        "pH": {"value": 5.5, "unit": ""},
        "organic_carbon": {"value": 2.50, "unit": "%"},
    },

    "red": {
        "nitrogen": {"value": 100, "unit": "kg/ha"},
        "phosphorus": {"value": 10, "unit": "mg/kg"},
        "potassium": {"value": 140, "unit": "kg/ha"},
        "pH": {"value": 6.2, "unit": ""},
        "organic_carbon": {"value": 0.50, "unit": "%"},
    },

    "sandy": {
        "nitrogen": {"value": 70, "unit": "kg/ha"},
        "phosphorus": {"value": 8, "unit": "mg/kg"},
        "potassium": {"value": 100, "unit": "kg/ha"},
        "pH": {"value": 6.3, "unit": ""},
        "organic_carbon": {"value": 0.30, "unit": "%"},
    },

    "sandy_loam": {
        "nitrogen": {"value": 110, "unit": "kg/ha"},
        "phosphorus": {"value": 12, "unit": "mg/kg"},
        "potassium": {"value": 150, "unit": "kg/ha"},
        "pH": {"value": 6.5, "unit": ""},
        "organic_carbon": {"value": 0.45, "unit": "%"},
    },

    "yellow": {
        "nitrogen": {"value": 95, "unit": "kg/ha"},
        "phosphorus": {"value": 9, "unit": "mg/kg"},
        "potassium": {"value": 120, "unit": "kg/ha"},
        "pH": {"value": 6.0, "unit": ""},
        "organic_carbon": {"value": 0.45, "unit": "%"},
    },
}


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def home():

    return {
        "message": "FarmVision backend is running",
        "gemini": (
            "configured"
            if gemini_client
            else "not configured"
        ),
        "disease_model": (
            "loaded"
            if disease_model is not None
            else "not loaded"
        ),
        "soil_model": (
            "configured"
            if ROBOFLOW_API_KEY
            else "not configured"
        ),
        "endpoints": [
            "/predict",
            "/soil-analyze",
            "/api/gemini-advice",
            "/api/gemini-tts",
        ],
    }


@app.get("/health")
def health():

    return {
        "status": "ok",
        "disease_model_loaded":
            disease_model is not None,
        "gemini_configured":
            gemini_client is not None,
        "roboflow_configured":
            bool(ROBOFLOW_API_KEY),
    }


# ============================================================
# DISEASE DETECTION
# ============================================================

@app.post("/predict")
async def predict_disease(
    file: UploadFile = File(...)
):

    if disease_model is None:

        raise HTTPException(
            status_code=503,
            detail="Disease model is not loaded",
        )

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file",
        )

    try:

        image_bytes = await file.read()

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        image = image.resize(
            (224, 224)
        )

        image_array = np.asarray(
            image,
            dtype=np.float32
        )

        image_array = (
            tf.keras.applications
            .mobilenet_v2
            .preprocess_input(
                image_array
            )
        )

        image_array = np.expand_dims(
            image_array,
            axis=0
        )

        predictions = (
            disease_model.predict(
                image_array,
                verbose=0
            )[0]
        )

        predicted_index = int(
            np.argmax(predictions)
        )

        confidence = float(
            predictions[predicted_index]
        )

        disease = CLASS_LABELS.get(
            str(predicted_index),
            f"Unknown disease (class {predicted_index})"
        )

        info = DISEASE_INFO.get(
            disease,
            DISEASE_INFO["healthy"]
        )

        return {
            "success": True,
            "disease": disease,
            "confidence": confidence,
            "confidence_percent": round(
                confidence * 100,
                2
            ),
            "name": disease,
            **info,
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
# SOIL ANALYSIS
# ============================================================

@app.post("/soil-analyze")
async def soil_analyze(
    file: UploadFile = File(...)
):

    if not ROBOFLOW_API_KEY:

        raise HTTPException(
            status_code=500,
            detail=(
                "Roboflow API key is not configured "
                "on the server"
            ),
        )

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a soil image",
        )

    try:

        image_data = await file.read()

        encoded_image = base64.b64encode(
            image_data
        ).decode("utf-8")

        response = requests.post(
            f"https://classify.roboflow.com/"
            f"{SOIL_ROBOFLOW_MODEL}",

            params={
                "api_key": ROBOFLOW_API_KEY
            },

            data=encoded_image,

            headers={
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            timeout=60,
        )

        if response.status_code != 200:

            print(
                "Roboflow error:",
                response.status_code,
                response.text
            )

            raise HTTPException(
                status_code=502,
                detail=(
                    "Soil classification service failed"
                ),
            )

        data = response.json()

        predictions = data.get(
            "predictions",
            {}
        )

        if not predictions:

            raise HTTPException(
                status_code=400,
                detail="No soil prediction returned",
            )

        best_class = max(
            predictions,
            key=lambda soil:
                predictions[soil]["confidence"]
        )

        confidence = float(
            predictions[best_class]["confidence"]
        )

        soil_type = best_class.lower()

        if (
            soil_type
            not in SOIL_PARAMETER_ENGINE
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Soil type '{best_class}' "
                    "is not supported"
                ),
            )

        parameters = (
            SOIL_PARAMETER_ENGINE[
                soil_type
            ]
        )

        return {

            "soil_type": best_class,

            "confidence": round(
                confidence * 100,
                2
            ),

            "parameters": {

                "nitrogen": {
                    "value":
                        parameters[
                            "nitrogen"
                        ]["value"],
                    "unit":
                        parameters[
                            "nitrogen"
                        ]["unit"],
                },

                "phosphorus": {
                    "value":
                        parameters[
                            "phosphorus"
                        ]["value"],
                    "unit":
                        parameters[
                            "phosphorus"
                        ]["unit"],
                },

                "potassium": {
                    "value":
                        parameters[
                            "potassium"
                        ]["value"],
                    "unit":
                        parameters[
                            "potassium"
                        ]["unit"],
                },

                "pH": {
                    "value":
                        parameters[
                            "pH"
                        ]["value"],
                    "unit":
                        parameters[
                            "pH"
                        ]["unit"],
                },

                "organic_carbon": {
                    "value":
                        parameters[
                            "organic_carbon"
                        ]["value"],
                    "unit":
                        parameters[
                            "organic_carbon"
                        ]["unit"],
                },
            },

            "note":
                "Soil parameters are prototype "
                "reference estimates based on "
                "predicted soil type.",
        }

    except requests.RequestException as exc:

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to connect to soil "
                f"classification service: {exc}"
            ),
        ) from exc

    except HTTPException:

        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Soil analysis failed: {exc}"
            ),
        ) from exc


# ============================================================
# GEMINI TEXT MODELS
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

        if (
            model
            and model not in unique_models
        ):

            unique_models.append(model)

    return unique_models


# ============================================================
# GEMINI TEXT GENERATION
# ============================================================

async def generate_gemini_text(
    prompt: str
):

    if gemini_client is None:

        raise RuntimeError(
            "Gemini client is not configured"
        )

    last_error = None

    for model in get_text_models():

        for attempt in range(3):

            try:

                print(
                    "Gemini text attempt:",
                    model,
                    attempt + 1
                )

                response = (
                    gemini_client
                    .models
                    .generate_content(
                        model=model,
                        contents=prompt,
                    )
                )

                return response, model

            except Exception as exc:

                last_error = exc

                error_text = str(exc)

                print(
                    "Gemini text error:",
                    error_text
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

    raise RuntimeError(
        "All Gemini text models failed: "
        f"{last_error}"
    )


# ============================================================
# GEMINI ADVICE REQUEST
# ============================================================

class GeminiAdviceRequest(BaseModel):

    question: str

    disease: str = ""

    crop: str = "Tomato"

    context: str = ""

    language: str = "en-US"


# ============================================================
# GEMINI ADVICE
# ============================================================

@app.post("/api/gemini-advice")
async def gemini_advice(
    request: GeminiAdviceRequest
):

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail":
                    "GEMINI_API_KEY "
                    "is not configured."
            },
        )

    language = request.language

    if (
        language
        not in SUPPORTED_LANGUAGES
    ):

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
            else
            "I could not generate a response."
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
            repr(exc)
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
                "detail":
                    "Gemini request failed: "
                    f"{error_text}"
            },
        )


# ============================================================
# GEMINI TTS
# ============================================================

class GeminiTTSRequest(BaseModel):

    text: str

    language: str = "en-US"


def pcm_to_wav(
    pcm_bytes: bytes,
    sample_rate: int = 24000,
    channels: int = 1,
    sample_width: int = 2,
):

    output = io.BytesIO()

    with wave.open(
        output,
        "wb"
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


@app.post("/api/gemini-tts")
async def gemini_tts(
    request: GeminiTTSRequest
):

    if gemini_client is None:

        return JSONResponse(
            status_code=500,
            content={
                "detail":
                    "GEMINI_API_KEY "
                    "is not configured."
            },
        )

    language = request.language

    if (
        language
        not in SUPPORTED_LANGUAGES
    ):

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

    for attempt in range(3):

        try:

            interaction = (
                gemini_client
                .interactions
                .create(
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
                None
            )

            if not output_audio:

                raise RuntimeError(
                    "Gemini TTS returned no audio."
                )

            audio_data = getattr(
                output_audio,
                "data",
                None
            )

            if not audio_data:

                raise RuntimeError(
                    "Gemini TTS returned "
                    "empty audio data."
                )

            if isinstance(
                audio_data,
                str
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
                "Gemini TTS attempt "
                f"{attempt + 1} failed:",
                error_text
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
            "detail":
                "Gemini TTS failed: "
                f"{error_text}"
        },
    )
