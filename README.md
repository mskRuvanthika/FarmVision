# 🌱 FarmVision — AI-Powered Crop Advisory Platform

> An intelligent agricultural platform that combines computer vision, soil analysis, crop advisory, and generative AI to support faster and more informed farming decisions.

**Live Application:** https://mskruvanthika.github.io/Lumina/

**GitHub Repository:** https://github.com/mskRuvanthika/Lumina

---

## 📌 Overview

FarmVision is a web-based AI-powered agricultural platform designed to assist farmers in identifying crop diseases, analysing soil conditions, and accessing crop-specific agricultural guidance through a unified interface.

The platform integrates machine learning, computer vision, generative AI, voice interaction, and multilingual support to provide an accessible digital agriculture solution.

### Core Capabilities

- AI-based crop disease detection
- Image-based soil analysis
- Crop suitability and advisory
- Generative AI agricultural assistant
- Voice-based interaction
- Multilingual assistance
- User authentication and profiles
- Digital records and monitoring
- Agricultural reference resources
- Interactive agricultural learning

---

## 🎯 Problem Statement

Farmers often face difficulties in identifying crop diseases early, understanding soil conditions, and accessing reliable agricultural guidance.

Traditional visual inspection can depend heavily on individual experience, while expert or laboratory assistance may not always be immediately available.

FarmVision addresses these challenges by bringing AI-assisted agricultural analysis and advisory services into a single digital platform.

---

## 💡 Solution

FarmVision follows an integrated workflow:

```text
                         FARMER
                            │
                            ▼
                  Upload / Capture Image
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       Disease Analysis              Soil Analysis
              │                           │
              ▼                           ▼
        AI Prediction               Soil Classification
              │                           │
              └─────────────┬─────────────┘
                            ▼
                   Confidence & Results
                            │
                            ▼
                    Crop Advisory
                            │
                            ▼
                  AI Voice Assistance
                            │
                            ▼
                   Digital Information
```

---

# ✨ Key Features

## 🌿 1. AI Crop Disease Detection

Farmers can upload a crop-leaf image and receive an AI-generated disease prediction.

### Detection Pipeline

```text
Leaf Image
     ↓
Image Preprocessing
     ↓
MobileNetV2
     ↓
Disease Classification
     ↓
Confidence Score
     ↓
Disease Information
     ↓
Advisory / Treatment Guidance
```

The current disease detection model is trained for 10 tomato disease and health classes using the PlantVillage dataset.

### Supported Classes

1. Bacterial Spot
2. Early Blight
3. Late Blight
4. Leaf Mold
5. Septoria Leaf Spot
6. Spider Mites — Two-Spotted Spider Mite
7. Target Spot
8. Tomato Yellow Leaf Curl Virus
9. Tomato Mosaic Virus
10. Healthy

---

## 🧪 2. AI Soil Analysis

FarmVision allows users to upload a soil image and obtain a predicted soil category.

### Soil Analysis Pipeline

```text
Soil Image
    ↓
Roboflow Classification Model
    ↓
Soil Type Prediction
    ↓
Confidence Score
    ↓
Reference Soil Parameters
    ↓
Soil Dashboard
```

The current implementation supports soil categories including:

- Alluvial
- Black
- Cinder
- Clay
- Laterite
- Loamy
- Peat
- Red
- Sandy
- Sandy Loam
- Yellow

The dashboard provides reference information for:

- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- pH
- Organic Carbon

> **Note:** The displayed soil parameters are prototype reference estimates associated with the predicted soil type. They should not be considered a substitute for laboratory soil testing.

---

## 🌾 3. Crop Advisory

The crop advisory module provides crop suitability recommendations using available soil parameters and crop requirements.

The current recommendation logic considers factors such as:

- Soil type
- Soil pH
- Nitrogen
- Phosphorus
- Potassium
- Crop requirements

The system provides farmers with an initial data-assisted basis for crop selection and agricultural decision-making.

---

## 🤖 4. AI Agricultural Assistant

FarmVision integrates Google Gemini to provide conversational agricultural assistance.

### Workflow

```text
Farmer Question
      ↓
Speech / Text Input
      ↓
FastAPI Backend
      ↓
Google Gemini
      ↓
Agricultural Response
      ↓
Text / Voice Output
```

The assistant can use contextual information such as:

- Crop
- Detected disease
- Farmer's question
- Selected language
- Available agricultural context

---

## 🎙️ 5. Voice Assistance

FarmVision supports browser-based speech recognition and AI-generated voice responses.

```text
Voice Input
    ↓
Speech Recognition
    ↓
Gemini Agricultural Assistant
    ↓
Generated Response
    ↓
Text-to-Speech
    ↓
Voice Output
```

### Voice API Endpoints

```text
POST /api/gemini-advice
POST /api/gemini-tts
```

---

## 🌐 6. Multilingual Support

FarmVision is designed to make agricultural information more accessible across language barriers.

The current implementation includes support for languages such as:

- English
- Tamil
- Hindi
- Telugu

The architecture can be extended to support additional Indian languages.

---

## 👤 7. Authentication and User Profile

The application includes user-oriented functionality such as:

- User authentication
- Protected application routes
- User profile
- User preferences
- Digital records
- Application history

Supabase is used for authentication and related user functionality.

---

## 🌦️ 8. Weather Information

The platform includes a weather dashboard interface providing information such as:

- Temperature
- Weather conditions
- Humidity
- Wind
- Rainfall
- Multi-day weather information

The current implementation uses application-side/mock data and can be connected to a validated live weather service for production deployment.

---

## 📈 9. Market Information

FarmVision includes a market information interface for displaying agricultural price-related information.

The current implementation uses application-side/mock data and provides a structure that can later be connected to a live agricultural market data source.

---

## 💬 10. Farmer Communication

The communication module provides user interaction and messaging functionality.

It supports:

- User lists
- Conversations
- Messages
- Message updates
- Local fallback data
- Supabase integration

---

## 🎮 11. Agricultural Learning

FarmVision includes an interactive agricultural learning module through its Agri Games feature.

The module contains scenarios related to:

- Crop management
- Disease awareness
- Weather conditions
- Agricultural decision-making

These activities are implemented primarily through frontend application logic.

---

## 📚 12. Agricultural Reference Resources

The platform includes a reference section containing agricultural research and information related to areas such as:

- Crop diseases
- Soil analysis
- Weather-based agriculture
- Irrigation
- Crop management
- Agricultural prediction systems

---

# 🏗️ System Architecture

FarmVision follows a modular frontend-backend-AI architecture.

```text
                         FARMER
                           │
                           ▼
                 ┌────────────────────┐
                 │   React Frontend   │
                 │ TypeScript + Vite  │
                 └─────────┬──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    Disease API       Soil Analysis      Gemini API
          │                │                │
          ▼                ▼                ▼
     MobileNetV2       Roboflow        Google Gemini
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                  Agricultural Results
                           │
                           ▼
                    Crop Advisory
```

---

# 🧠 Machine Learning

## Disease Detection Model

The crop disease detection system uses **MobileNetV2 transfer learning**.

### Training Pipeline

```text
PlantVillage Dataset
        ↓
Image Preprocessing
        ↓
Image Resizing
        ↓
Data Augmentation
        ↓
MobileNetV2
        ↓
Transfer Learning
        ↓
Fine-Tuning
        ↓
Disease Classification
        ↓
Keras Model
        ↓
Hugging Face
        ↓
FastAPI Inference
```

### Model Files

```text
tomato_disease_model.keras
class_labels.json
```

The backend can download the trained model and label files from the project's Hugging Face model repository when required.

### Model Repository

```text
Ruvanthika18/tomato-disease-model
```

---

# 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | React |
| Programming Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Backend Language | Python |
| Disease Detection | MobileNetV2 |
| ML Framework | TensorFlow / Keras |
| Disease Dataset | PlantVillage |
| Disease Model Hosting | Hugging Face |
| Soil Classification | Roboflow |
| Generative AI | Google Gemini |
| Authentication | Supabase |
| Voice Input | Web Speech API |
| Voice Output | Gemini TTS |
| Frontend Hosting | GitHub Pages |
| Backend Hosting | Render |

---

# 🔌 Backend API

FarmVision uses FastAPI to expose AI and agricultural services.

## Health Check

```http
GET /
```

```http
GET /health
```

These endpoints provide backend and service health information.

---

## Crop Disease Detection

```http
POST /predict
```

### Input

Multipart image upload:

```text
file = crop leaf image
```

### Example Response

```json
{
  "success": true,
  "disease": "Late blight",
  "confidence": 0.91,
  "confidence_percent": 91.0
}
```

---

## Soil Analysis

```http
POST /soil-analyze
```

### Input

```text
file = soil image
```

### Response

The endpoint provides information including:

```text
Soil Type
Confidence
Nitrogen
Phosphorus
Potassium
pH
Organic Carbon
```

---

## Gemini Agricultural Advice

```http
POST /api/gemini-advice
```

### Example Request

```json
{
  "question": "How should I manage this disease?",
  "disease": "Late blight",
  "crop": "Tomato",
  "context": "",
  "language": "en-US"
}
```

---

## Gemini Text-to-Speech

```http
POST /api/gemini-tts
```

Converts generated agricultural guidance into audio for voice-based assistance.

---

# 📂 Project Structure

```text
Lumina/
│
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── catalyst-package.yml
│
├── backend/
│   ├── app.py
│   ├── server.py
│   ├── class_labels.json
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── src/
│   └── app/
│       ├── chatbot/
│       │
│       ├── components/
│       │   ├── AgriGames.tsx
│       │   ├── AuthProvider.tsx
│       │   ├── Communication.tsx
│       │   ├── CropAdvisory.tsx
│       │   ├── Dashboard.tsx
│       │   ├── DiseaseDetection.tsx
│       │   ├── Login.tsx
│       │   ├── MarketPrices.tsx
│       │   ├── Profile.tsx
│       │   ├── ReferencePapers.tsx
│       │   ├── SoilAnalysis.tsx
│       │   ├── VoiceAssistantModal.tsx
│       │   └── WeatherDashboard.tsx
│       │
│       ├── App.tsx
│       └── routes.tsx
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Python 3.10+
- Git

For the AI services, appropriate API credentials are also required.

---

## 1. Clone the Repository

```bash
git clone https://github.com/mskRuvanthika/Lumina.git
cd Lumina
```

---

## 2. Frontend Setup

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Configure the required frontend environment variables.

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## 3. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

### Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the required packages:

```bash
pip install -r requirements.txt
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Configure the required API credentials.

Start the FastAPI server:

```bash
python -m uvicorn server:app --reload --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

# 🔐 Environment Variables

## Backend

Create a `.env` file inside the `backend` directory.

```env
GEMINI_API_KEY=your_gemini_api_key
ROBOFLOW_API_KEY=your_roboflow_api_key
```

## Frontend

Configure the required frontend variables in:

```text
.env
```

Use the variables provided in:

```text
.env.example
```

> **Security:** Never commit real API keys, passwords, access tokens, or private credentials to GitHub.

---

# ☁️ Deployment

## Frontend — GitHub Pages

The frontend is deployed through GitHub Pages using GitHub Actions.

Deployment workflow:

```text
Git Push
   ↓
GitHub Actions
   ↓
Install Dependencies
   ↓
Vite Build
   ↓
GitHub Pages
```

Production URL:

```text
https://mskruvanthika.github.io/Lumina/
```

---

## Backend — Render

The FastAPI backend is deployed as a web service on Render.

```text
React Application
       ↓
FastAPI Backend
       ↓
AI / ML Services
```

The backend exposes:

```text
/predict
/soil-analyze
/api/gemini-advice
/api/gemini-tts
```

Production environment variables should be configured through the Render environment settings.

---

# 📊 Data & AI Sources

## Disease Detection

The disease detection model was trained using the **PlantVillage** dataset.

## Disease Model

The trained model is hosted through the project's Hugging Face model repository:

```text
Ruvanthika18/tomato-disease-model
```

## Soil Classification

Soil image classification uses a hosted Roboflow model:

```text
soil-type-ladmq/6
```

## Generative AI

Agricultural conversational assistance is powered by:

```text
Google Gemini
```

---

# ⚠️ Limitations

FarmVision is designed as an **AI-assisted agricultural decision-support platform** and is not intended to replace agricultural experts or laboratory testing.

Current limitations include:

- Prediction quality depends on image quality.
- Visually similar diseases can be difficult to distinguish.
- Training datasets may not represent every regional crop variety or field condition.
- Soil reference parameters are not laboratory measurements.
- Low-confidence predictions should be verified by an agricultural expert.
- Current weather information uses application-side/mock data.
- Current market information uses application-side/mock data.
- Real-world field validation is required before large-scale deployment.

---

# 🔮 Future Scope

FarmVision can be extended with:

- Larger real-world agricultural image datasets
- Support for additional crops and diseases
- Laboratory-integrated soil analysis
- Live weather APIs
- Live agricultural market data
- Additional Indian languages
- Low-bandwidth and offline support
- Satellite and remote-sensing integration
- Village-level agricultural monitoring
- District-level agricultural intelligence
- Digital farm and field visualisation
- Continuous model improvement
- Integration with agricultural institutions and government systems

---

# 🎯 Project Impact

FarmVision aims to improve accessibility to agricultural intelligence by bringing multiple agricultural services into a single platform.

### For Farmers

- Faster preliminary disease identification
- AI-assisted soil analysis
- Crop-specific guidance
- Multilingual agricultural assistance
- Centralized agricultural information

### For Agricultural Institutions

- Data-assisted agricultural monitoring
- Scalable digital infrastructure
- Potential integration with institutional datasets
- Digital agricultural records

### For Communities

- Improved access to agricultural knowledge
- Digital agricultural resources
- Potential village-level agricultural intelligence

---

# 🧩 Project Highlights

FarmVision combines:

```text
Computer Vision
       +
Machine Learning
       +
Soil Intelligence
       +
Generative AI
       +
Voice Assistance
       +
Multilingual Support
       +
Agricultural Advisory
       +
Digital Agriculture
```

The modular architecture allows individual AI services and agricultural modules to evolve independently while remaining part of a unified agricultural platform.

---

# 🔒 Responsible AI

FarmVision is intended to provide **preliminary AI-assisted insights**.

Users should consider the confidence score and available agricultural context before acting on a prediction.

For uncertain or low-confidence results, professional agricultural or laboratory verification is recommended.

The platform should be further validated using diverse real-world field data before being used for large-scale agricultural decision-making.

---

# 📜 License

No project license is currently specified.

If this project is intended for public reuse or open-source distribution, an appropriate license can be added based on the project's intended usage.

---

# 🌱 FarmVision

**AI-assisted agriculture for faster, smarter, and more accessible crop management.**

**Live Application:**  
https://mskruvanthika.github.io/Lumina/

**GitHub Repository:**  
https://github.com/mskRuvanthika/Lumina
