import os
import librosa
import numpy as np
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import ModelCheckpoint
import pickle

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "voices")
MODEL_PATH = os.path.join(BASE_DIR, "emotion_model.h5")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")


def extract_features(file_path, max_pad_len=174):
    audio, sr = librosa.load(file_path, res_type='kaiser_fast')
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    pad_width = max_pad_len - mfcc.shape[1]
    mfcc = np.pad(mfcc, pad_width=((0, 0), (0, pad_width)), mode='constant')
    return mfcc

def load_data():
    X, y = [], []
    for folder in os.listdir(DATASET_PATH):
        folder_path = os.path.join(DATASET_PATH, folder)
        if os.path.isdir(folder_path):
            emotion = folder.split("_")[-1].lower()
            for file in os.listdir(folder_path):
                if file.endswith(".wav"):
                    path = os.path.join(folder_path, file)
                    features = extract_features(path)
                    X.append(features)
                    y.append(emotion)
    return np.array(X), np.array(y)

def train_model():
    X, y = load_data()
    X = X[..., np.newaxis]  # Shape: (samples, 40, 174, 1)
    le = LabelEncoder()
    y_encoded = to_categorical(le.fit_transform(y))

    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(40, 174, 1)),
        MaxPooling2D((2, 2)),
        Dropout(0.3),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Dropout(0.3),
        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(y_encoded.shape[1], activation='softmax')
    ])

    checkpoint = ModelCheckpoint(MODEL_PATH, monitor='val_accuracy', save_best_only=True, mode='max')


    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.fit(X, y_encoded, epochs=50, batch_size=32, validation_split=0.2,
              callbacks=[checkpoint])

    model.save(MODEL_PATH)
    with open(ENCODER_PATH, 'wb') as f:
        pickle.dump(le, f)

if __name__ == "__main__":
    train_model()