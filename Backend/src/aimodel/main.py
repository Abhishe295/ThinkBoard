from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np
import librosa
from collections import Counter
from datetime import datetime, timedelta
from fastapi import Form, File, UploadFile
from starlette.requests import Request
import tempfile

app = FastAPI()

# In-memory store for user emotions
user_emotion_history = {}

# -------------------------------
# Request Schemas
# -------------------------------
class CameraRequest(BaseModel):
    user_id: str

class VoiceRequest(BaseModel):
    user_id: str
    file_url: str

class FormRequest(BaseModel):
    user_id: str
    phq9: list[int]
    gad7: list[int]


# -------------------------------
# Camera-based emotion detection
# -------------------------------
# @app.post("/detect-emotion/camera")
# def detect_emotion_camera(req: CameraRequest):
#     user_id = req.user_id

#     cap = cv2.VideoCapture(0)  # Open webcam
#     if not cap.isOpened():
#         return JSONResponse(content={"error": "Camera not accessible"}, status_code=500)

#     emotions = ["happy", "sad", "angry", "neutral"]
#     detected_emotion = "neutral"
#     start_time = datetime.now()

#     while (datetime.now() - start_time).seconds < 5:
#         ret, frame = cap.read()
#         if not ret:
#             break
#         detected_emotion = np.random.choice(emotions)

#     cap.release()

#     entry = {
#         "emotion": detected_emotion,
#         "timestamp": datetime.now().isoformat(),
#         "source": "camera"
#     }
#     user_emotion_history.setdefault(user_id, []).append(entry)
#     print(user_emotion_history)

#     return {"user_id": user_id, "detected_emotion": detected_emotion, "history": user_emotion_history[user_id]}

@app.post("/detect-emotion/image")
async def detect_emotion_image(user_id: str = Form(...), file: UploadFile = File(...)):
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Simulated emotion detection
    detected_emotion = np.random.choice(["happy", "sad", "angry", "neutral"])

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "image"
    }
    print(entry)
    user_emotion_history.setdefault(user_id, []).append(entry)

    return {
        "user_id": user_id,
        "detected_emotion": detected_emotion,
        "history": user_emotion_history[user_id]
    }



# -------------------------------
# Voice-based emotion detection
# -------------------------------
@app.post("/detect-emotion/voice")
async def detect_emotion_voice(
    user_id: str = Form(...), 
    file: UploadFile = File(...)
):
    if not file:
        return JSONResponse(content={"error": "No file uploaded"}, status_code=400)
    

    try:
        print("Got user_id:", user_id)
        print("Got file:", file.filename, file.content_type)

        contents = await file.read()
        # librosa requires a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        y, sr = librosa.load(tmp_path, sr=None)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)

        emotions = ["happy", "sad", "angry", "neutral"]
        detected_emotion = np.random.choice(emotions)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "voice"
    }
    user_emotion_history.setdefault(user_id, []).append(entry)

    return {
        "user_id": user_id,
        "detected_emotion": detected_emotion,
        "history": user_emotion_history[user_id]


    }
# -------------------------------
# Form-based emotion detection
# -------------------------------

@app.post("/detect-emotion/form")
def detect_emotion_form(req: FormRequest):
    user_id = req.user_id

    # calculate totals
    phq9_score = sum(req.phq9)
    gad7_score = sum(req.gad7)

    # Simple mapping from scores → emotion
    if phq9_score <= 4 and gad7_score <= 4:
        detected_emotion = "happy"
    elif phq9_score >= 15 or gad7_score >= 15:
        detected_emotion = "sad"
    elif gad7_score >= 10:
        detected_emotion = "angry"
    else:
        detected_emotion = "neutral"

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "form",
        "phq9_score": phq9_score,
        "gad7_score": gad7_score
    }
    user_emotion_history.setdefault(user_id, []).append(entry)

    return {
        "user_id": user_id,
        "detected_emotion": detected_emotion,
        "phq9_score": phq9_score,
        "gad7_score": gad7_score,
        "history": user_emotion_history[user_id]
    }

# -------------------------------
# Get User Emotion History
# -------------------------------


@app.get("/emotion-history/{user_id}")
def get_emotion_history(user_id: str):
    history = user_emotion_history.get(user_id, [])
    if not history:
        return {
            "user_id": user_id,
            "message": "No emotion data available."
        }

    cutoff_date = datetime.now() - timedelta(days=30)
    recent_history = [
        entry for entry in history
        if datetime.fromisoformat(entry["timestamp"]) >= cutoff_date
    ]

    if not recent_history:
        return {
            "user_id": user_id,
            "message": "No emotion data available in the last 30 days."
        }

    # --- DAILY EMOTIONS (group by date) ---
    daily = {}
    for entry in recent_history:
        day = datetime.fromisoformat(entry["timestamp"]).strftime("%Y-%m-%d")
        daily.setdefault(day, []).append(entry["emotion"])

    daily_summary = {
        day: Counter(emotions).most_common(1)[0][0]  # top emotion of the day
        for day, emotions in daily.items()
    }

    # --- WEEKLY EMOTIONS ---
    weekly = {}
    for entry in recent_history:
        year, week, _ = datetime.fromisoformat(entry["timestamp"]).isocalendar()
        week_key = f"{year}-W{week}"
        weekly.setdefault(week_key, []).append(entry["emotion"])

    weekly_summary = {
        week: Counter(emotions).most_common(1)[0][0]
        for week, emotions in weekly.items()
    }

    # --- MONTHLY EMOTIONS ---
    monthly = {}
    for entry in recent_history:
        month_key = datetime.fromisoformat(entry["timestamp"]).strftime("%Y-%m")
        monthly.setdefault(month_key, []).append(entry["emotion"])

    monthly_summary = {
        month: Counter(emotions).most_common(1)[0][0]
        for month, emotions in monthly.items()
    }

    # --- TOP EMOTIONS (last 30 days overall) ---
    emotion_counts = Counter(entry["emotion"] for entry in recent_history)
    top_emotions = emotion_counts.most_common(2)
    

    return {
        "user_id": user_id,
        "daily_summary": daily_summary,       # each day’s top emotion
        "weekly_summary": weekly_summary,     # each week’s top emotion
        "monthly_summary": monthly_summary,   # each month’s top emotion
        "top_emotions_last_30_days": top_emotions,
        "total_entries_analyzed": len(recent_history)
    }

