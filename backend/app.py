from pathlib import Path
import io
import json

import numpy as np
import tensorflow as tf
from huggingface_hub import snapshot_download
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "tomato_disease_model.keras"
LABELS_PATH = BASE_DIR / "class_labels.json"
HF_REPO = "Ruvanthika18/tomato-disease-model"

app = FastAPI(title="AI Crop Advisory - Tomato Disease API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
class_labels = {}


def load_resources():
    global model, class_labels

    # Download the public model repository automatically on first run if the
    # model files are not bundled locally. No Hugging Face token is required.
    if not MODEL_PATH.exists() or not LABELS_PATH.exists():
        snapshot_download(
            repo_id=HF_REPO,
            local_dir=BASE_DIR,
            allow_patterns=["tomato_disease_model.keras", "class_labels.json"],
        )

    if not MODEL_PATH.exists() or not LABELS_PATH.exists():
        raise FileNotFoundError(
            "Model files are missing. Place tomato_disease_model.keras and class_labels.json in backend/."
        )

    model = tf.keras.models.load_model(MODEL_PATH)
    with LABELS_PATH.open("r", encoding="utf-8") as f:
        class_labels = json.load(f)


DISEASE_INFO = {
    "Bacterial spot": {
        "nameHindi": "जीवाणु धब्बा रोग",
        "severity": "High",
        "description": "A bacterial disease that causes dark water-soaked or necrotic spots on tomato leaves and fruit.",
        "descriptionHindi": "जीवाणु रोग जो टमाटर की पत्तियों और फलों पर गहरे धब्बे पैदा करता है।",
        "treatment": ["Remove severely infected leaves", "Avoid overhead irrigation", "Improve air circulation and spacing", "Use an appropriate copper-based bactericide only as locally recommended"],
        "treatmentHindi": ["बहुत संक्रमित पत्तियां हटाएं", "ऊपर से सिंचाई से बचें", "पौधों के बीच उचित दूरी रखें", "स्थानीय सलाह के अनुसार उपयुक्त कॉपर आधारित जीवाणुनाशी का उपयोग करें"],
    },
    "Early blight": {
        "nameHindi": "अर्ली ब्लाइट",
        "severity": "Moderate",
        "description": "A fungal disease commonly producing brown concentric-ring lesions on older tomato leaves.",
        "descriptionHindi": "एक फफूंद रोग जिसमें पुरानी टमाटर की पत्तियों पर भूरे गोलाकार धब्बे बन सकते हैं।",
        "treatment": ["Remove infected lower leaves", "Keep foliage dry when possible", "Improve plant spacing and airflow", "Use a locally recommended fungicide when necessary"],
        "treatmentHindi": ["संक्रमित निचली पत्तियां हटाएं", "पत्तियों को यथासंभव सूखा रखें", "पौधों में हवा का संचार बढ़ाएं", "आवश्यकता पर स्थानीय सलाह के अनुसार कवकनाशी उपयोग करें"],
    },
    "Late blight": {
        "nameHindi": "लेट ब्लाइट",
        "severity": "High",
        "description": "A destructive disease that can cause dark, rapidly expanding lesions on tomato foliage.",
        "descriptionHindi": "एक गंभीर रोग जो टमाटर की पत्तियों पर तेजी से फैलने वाले गहरे धब्बे पैदा कर सकता है।",
        "treatment": ["Remove affected plant material promptly", "Avoid prolonged leaf wetness", "Improve airflow and field sanitation", "Use a locally recommended fungicide program when confirmed"],
        "treatmentHindi": ["संक्रमित पौध सामग्री तुरंत हटाएं", "पत्तियों पर लंबे समय तक नमी न रहने दें", "हवा का संचार और खेत की स्वच्छता सुधारें", "पुष्टि होने पर स्थानीय सलाह के अनुसार कवकनाशी कार्यक्रम अपनाएं"],
    },
    "Leaf Mold": {
        "nameHindi": "लीफ मोल्ड",
        "severity": "Moderate",
        "description": "A fungal disease associated with humid conditions, often producing yellow areas and mold growth on leaf undersides.",
        "descriptionHindi": "नमी वाली परिस्थितियों से जुड़ा फफूंद रोग, जिसमें पत्तियों पर पीले क्षेत्र और नीचे की ओर फफूंद दिखाई दे सकती है।",
        "treatment": ["Reduce humidity around foliage", "Improve ventilation", "Remove affected leaves", "Use locally recommended fungicide if needed"],
        "treatmentHindi": ["पत्तियों के आसपास नमी कम करें", "हवादारी बढ़ाएं", "संक्रमित पत्तियां हटाएं", "आवश्यकता पर स्थानीय सलाह के अनुसार कवकनाशी उपयोग करें"],
    },
    "Septoria leaf spot": {
        "nameHindi": "सेप्टोरिया लीफ स्पॉट",
        "severity": "Moderate",
        "description": "A fungal leaf-spot disease that can cause numerous small circular lesions on tomato foliage.",
        "descriptionHindi": "एक फफूंद रोग जिसमें टमाटर की पत्तियों पर कई छोटे गोल धब्बे बन सकते हैं।",
        "treatment": ["Remove infected lower leaves", "Avoid splashing water onto foliage", "Improve spacing and sanitation", "Use a locally recommended fungicide when necessary"],
        "treatmentHindi": ["संक्रमित निचली पत्तियां हटाएं", "पत्तियों पर पानी के छींटों से बचें", "दूरी और स्वच्छता सुधारें", "आवश्यकता पर स्थानीय सलाह के अनुसार कवकनाशी उपयोग करें"],
    },
    "Spider mites Two-spotted spider mite": {
        "nameHindi": "स्पाइडर माइट",
        "severity": "Moderate",
        "description": "A mite pest that can cause stippling, yellowing and webbing on tomato leaves, especially under hot dry conditions.",
        "descriptionHindi": "एक कीट जो विशेषकर गर्म और शुष्क परिस्थितियों में पत्तियों पर पीलेपन, बारीक धब्बों और जाले का कारण बन सकता है।",
        "treatment": ["Inspect leaf undersides", "Use water spray to reduce dust and mites where appropriate", "Encourage beneficial predators", "Use an appropriate miticide only when needed and according to its label"],
        "treatmentHindi": ["पत्तियों की निचली सतह जांचें", "उचित होने पर पानी का छिड़काव करें", "लाभकारी प्राकृतिक शत्रुओं को सुरक्षित रखें", "जरूरत पर लेबल के अनुसार उपयुक्त माइटनाशी का उपयोग करें"],
    },
    "Target Spot": {
        "nameHindi": "टार्गेट स्पॉट",
        "severity": "Moderate",
        "description": "A fungal disease producing circular brown lesions that may develop a target-like pattern.",
        "descriptionHindi": "एक फफूंद रोग जिसमें गोल भूरे धब्बे बन सकते हैं और लक्ष्य जैसे छल्ले दिखाई दे सकते हैं।",
        "treatment": ["Remove heavily affected leaves", "Improve air circulation", "Avoid prolonged leaf wetness", "Use locally recommended fungicide when necessary"],
        "treatmentHindi": ["बहुत संक्रमित पत्तियां हटाएं", "हवा का संचार बढ़ाएं", "पत्तियों पर लंबे समय तक नमी से बचें", "आवश्यकता पर स्थानीय सलाह के अनुसार कवकनाशी उपयोग करें"],
    },
    "Tomato Yellow Leaf Curl Virus": {
        "nameHindi": "टमाटर येलो लीफ कर्ल वायरस",
        "severity": "High",
        "description": "A viral disease often associated with leaf curling, yellowing and stunted plant growth.",
        "descriptionHindi": "एक वायरल रोग जिसमें पत्तियां मुड़ सकती हैं, पीली पड़ सकती हैं और पौधे की वृद्धि रुक सकती है।",
        "treatment": ["Remove severely affected plants when appropriate", "Control whitefly vectors", "Remove weed hosts around the crop", "Use healthy seedlings and resistant varieties where available"],
        "treatmentHindi": ["उचित होने पर बहुत संक्रमित पौधे हटाएं", "सफेद मक्खी का नियंत्रण करें", "फसल के आसपास खरपतवार हटाएं", "जहां उपलब्ध हो स्वस्थ पौधे और प्रतिरोधी किस्में उपयोग करें"],
    },
    "Tomato mosaic virus": {
        "nameHindi": "टमाटर मोज़ेक वायरस",
        "severity": "High",
        "description": "A viral disease that can cause mottled or mosaic leaf patterns and reduced plant growth.",
        "descriptionHindi": "एक वायरल रोग जिसमें पत्तियों पर मोज़ेक जैसे पैटर्न और पौधे की वृद्धि में कमी हो सकती है।",
        "treatment": ["Remove infected plants or tissues where appropriate", "Disinfect tools and hands after handling plants", "Avoid tobacco contamination during handling", "Use certified healthy seed or seedlings"],
        "treatmentHindi": ["उचित होने पर संक्रमित पौधे या भाग हटाएं", "पौधों को संभालने के बाद औजार और हाथ साफ करें", "पौधों को संभालते समय तंबाकू से दूषण से बचें", "प्रमाणित स्वस्थ बीज या पौध उपयोग करें"],
    },
    "healthy": {
        "nameHindi": "स्वस्थ पत्ता",
        "severity": "Low",
        "description": "No visible disease pattern was detected by the model in this image.",
        "descriptionHindi": "इस छवि में मॉडल ने रोग का स्पष्ट पैटर्न नहीं पाया।",
        "treatment": ["Continue regular crop monitoring", "Maintain good spacing and airflow", "Water appropriately and avoid unnecessary leaf wetness", "Inspect plants regularly for new symptoms"],
        "treatmentHindi": ["फसल की नियमित निगरानी जारी रखें", "उचित दूरी और हवा का संचार बनाए रखें", "उचित सिंचाई करें और अनावश्यक पत्ती नमी से बचें", "नए लक्षणों के लिए पौधों की नियमित जांच करें"],
    },
}


@app.on_event("startup")
def startup_event():
    load_resources()


@app.get("/")
def home():
    return {"message": "🌿 Tomato Disease Detection API is running!"}


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image = image.resize((224, 224))
        image_array = np.asarray(image, dtype=np.float32)
        image_batch = np.expand_dims(image_array, axis=0)
        image_batch = tf.keras.applications.mobilenet_v2.preprocess_input(image_batch)

        predictions = model.predict(image_batch, verbose=0)[0]
        predicted_index = int(np.argmax(predictions))
        confidence = float(predictions[predicted_index] * 100)
        disease = class_labels[str(predicted_index)]
        info = DISEASE_INFO.get(disease, DISEASE_INFO["healthy"])

        return {
            "disease": disease,
            "confidence": round(confidence, 2),
            "name": disease,
            **info,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}") from exc
