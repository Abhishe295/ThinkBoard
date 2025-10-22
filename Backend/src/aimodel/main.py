from fastapi import FastAPI,UploadFile,File,Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
import librosa
import subprocess
from collections import Counter
from datetime import datetime, timedelta
from fastapi import Form, File, UploadFile
from starlette.requests import Request
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from camera.cameraMain import predict_emotion_camera
import os
from speech.voiceMain import predict_emotion_voice

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mindwell-three.vercel.app",
        "https://backend-8nby.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/detect-emotion/image")
async def detect_emotion_image(user_id: str = Form(...), file: UploadFile = File(...)):
    # Save uploaded image to a temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        temp_file.write(await file.read())
        temp_file_path = temp_file.name

    # Run actual emotion detection
    try:
        detected_emotion = predict_emotion_camera(temp_file_path)
    except Exception as e:
        print("Prediction error:", e)
        detected_emotion = "unknown"

    entry = {
        "emotion": detected_emotion,
        "timestamp": datetime.now().isoformat(),
        "source": "image"
    }
    print(entry)
    user_emotion_history.setdefault(user_id, []).append(entry)

    os.remove(temp_file_path)

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
    FFMPEG_PATH = r"C:\ffmpeg\ffmpeg-2025-10-16-git-cd4b01707d-full_build\bin\ffmpeg.exe"
    if not file:
        return JSONResponse(content={"error": "No file uploaded"}, status_code=400)

    try:
        contents = await file.read()

        # Save uploaded file temporarily
# Save uploaded audio (whatever type) to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
            tmp_in.write(contents)
            tmp_input = tmp_in.name

        # Create a *different* path for converted wav output
        tmp_output = tmp_input.replace(".webm", "_converted.wav")

        # Convert input → proper mono 22kHz wav
        subprocess.run([
            "ffmpeg", "-v","error", "-i", tmp_input, "-ar", "22050", "-ac", "1", tmp_output
        ], check=True)

        # Now feed the converted file to your model
        detected_emotion = predict_emotion_voice(tmp_output)

        # Cleanup temp files
        os.remove(tmp_input)
        os.remove(tmp_output)


    except Exception as e:
        import traceback
        print("ERROR in /detect-emotion/voice:", traceback.format_exc())
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

