# speech/voiceMain.py
import librosa
import numpy as np
import pickle
from tensorflow.keras.models import load_model

MODEL_PATH = "speech/emotion_model.h5"
ENCODER_PATH = "speech/label_encoder.pkl"

model = load_model(MODEL_PATH)
with open(ENCODER_PATH, 'rb') as f:
    le = pickle.load(f)

def extract_features(file_path, max_len=174):
    audio, sr = librosa.load(file_path, res_type='kaiser_fast')
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    if mfcc.shape[1] < max_len:
        pad_width = max_len - mfcc.shape[1]
        mfcc = np.pad(mfcc, pad_width=((0, 0), (0, pad_width)), mode='constant')
    else:
        mfcc = mfcc[:, :max_len]

    return mfcc

def predict_emotion_voice(file_path):
    features = extract_features(file_path)
    features = features[np.newaxis, ..., np.newaxis]  # Shape: (1, 40, 174, 1)
    prediction = model.predict(features)
    predicted_label = le.inverse_transform([np.argmax(prediction)])
    print("Predicting emotion for file", file_path)
    print("Emotion Predicted", predicted_label[0])
    return predicted_label[0]