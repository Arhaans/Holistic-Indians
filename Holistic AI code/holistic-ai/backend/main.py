from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../models/logistic_regression_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "../models/tfidf_vectorizer.pkl")

PREDICTION_LABELS = {0: "stereotype", 1: "unrelated", 2: "neutral"}

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError("Failed to load model. Check the file path and compatibility.")

try:
    vectorizer = joblib.load(VECTORIZER_PATH)
    placeholder_data = [
        "Asians can't drive because they have slanted eyes",
        "Black people love fried chicken",
        "Women can't do math",
        "Men don't cry",
        "People with tattoos are unprofessional"
    ]
    refitted_vectorizer = TfidfVectorizer(vocabulary=vectorizer.vocabulary_)
    refitted_vectorizer.fit(placeholder_data)
except Exception as e:
    raise RuntimeError("Failed to load or refit vectorizer. Check the file path and data.")

class TextRequest(BaseModel):
    text: str

def contains_sensitive_information(text: str) -> bool:
    patterns = [
        r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b",  # Social Security number (SSN)
        r"\b\d{16}\b",  # Credit card numbers
        r"\b(\d{10}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4})\b",  # Phone numbers
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b",  # Emails
        r"\b\d{1,5}[\s\-]?[A-Za-z0-9\s,]{5,}\b",  # Address-like patterns (refined to avoid short false matches)
        r"\b[a-zA-Z]+\d{3,}[a-zA-Z\d]*\b",  # Password-like patterns with at least 3 digits#
    ]
    for pattern in patterns:
        if re.search(pattern, text):
            return True
    return False

@app.get("/")
def read_root():
    return {"message": "Bias Detection API is running!"}

@app.post("/predict")
def predict_bias(request: TextRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty or whitespace.")
        if contains_sensitive_information(request.text):
            raise HTTPException(status_code=400, detail="Sensitive information detected. Our system cannot process such data.")
        try:
            text_vectorized = refitted_vectorizer.transform([request.text])
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to vectorize input text.")
        try:
            prediction = model.predict(text_vectorized)[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail="Prediction failed.")
        prediction_label = PREDICTION_LABELS.get(int(prediction), "unknown")
        response_message = f"The text is classified as '{prediction_label}'."
        return {
            "text": request.text,
            "bias_prediction": prediction_label,
            "message": response_message
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
