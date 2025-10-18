from keras.models import model_from_json
from keras.preprocessing.image import load_img, img_to_array
import numpy as np
import os

base_dir = os.path.dirname(__file__)
json_path = os.path.join(base_dir, "emotiondetector.json")
weights_path = os.path.join(base_dir, "emotiondetector.h5")


with open(json_path, "r") as json_file:
    model_json = json_file.read()
model = model_from_json(model_json)
model.load_weights(weights_path)

label = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

def preprocess_image(image_path):
    img = load_img(image_path, color_mode='grayscale', target_size=(48, 48))
    feature = img_to_array(img).reshape(1, 48, 48, 1)
    return feature / 255.0

def predict_emotion(image_path):
    img = preprocess_image(image_path)
    prediction = model.predict(img)
    print("prob",prediction)
    return label[np.argmax(prediction)]
