import joblib

# Load the saved model and vectorizer
vectorizer = joblib.load("models/tfidf_vectorizer.pkl")
model = joblib.load("models/logistic_regression_model.pkl")

def predict_bias(text):
    """Make predictions using the logistic regression model."""
    text_vectorized = vectorizer.transform([text])  
    prediction = model.predict(text_vectorized)     
    return prediction[0]                            