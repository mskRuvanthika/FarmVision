# Tomato Disease API

This backend serves the trained MobileNetV2 tomato disease model used by the React app.

## Model

The backend uses the trained model from the public Hugging Face repository `Ruvanthika18/tomato-disease-model`. On first startup, if the model files are not already in `backend/`, the backend downloads `tomato_disease_model.keras` and `class_labels.json` automatically. No Hugging Face token is needed.

For an offline presentation, you can also place those two files directly in this `backend` folder before starting the API.

## Windows setup

Open PowerShell in the `backend` folder:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8000
```

If PowerShell blocks activation, run the backend with the venv Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --reload --port 8000
```

Check `http://127.0.0.1:8000/health`.

## Frontend

From the project root:

```powershell
npm run dev
```

The React disease detection page sends the selected image to `http://127.0.0.1:8000/predict`.
