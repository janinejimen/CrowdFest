import os
import cv2
import numpy as np
from dotenv import load_dotenv
from inference.models.utils import get_roboflow_model
import time
import firebase_admin
from firebase_admin import credentials, db, storage

# 1. LOAD API KEY (needed only to download model once)
load_dotenv()
API_KEY = os.getenv("ROBOFLOW_API_KEY")

# 2. INITIALIZE FIREBASE
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://wics-hack26.firebaseio.com/',
    'storageBucket': 'wics-hack26.appspot.com'
})

bucket = storage.bucket()
db_ref = db.reference('live_stats')

# 3. LOAD MODEL LOCALLY (crowd counting model)
MODEL_ID = "crowd-counting-dataset-w3o7w/2"
model = get_roboflow_model(
    model_id=MODEL_ID,
    api_key=API_KEY,
)

print(f"✅ Model loaded: {MODEL_ID}")

# Open camera
cap = cv2.VideoCapture(0)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

# Performance Settings
SKIP_FRAMES = 3  # Process every 3rd frame for speed
skip_counter = 0
last_detections = 0
last_flashlights = 0

print("🎥 Crowd + Flashlight Detection Started...")
print(f"Camera resolution: {width}x{height}")
print(f"Processing every {SKIP_FRAMES} frames locally (no API calls)")

def detect_flashlights(frame):
    """Detect bright spots (flashlights) in the frame"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Find super bright spots (flashlights) - threshold 220
    _, bright_spots = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
    
    # Find contours (potential flashlights)
    contours, _ = cv2.findContours(bright_spots, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    flashlight_count = 0
    flashlight_boxes = []
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 30:  # ignore tiny noise
            x, y, w, h = cv2.boundingRect(cnt)
            flashlight_count += 1
            flashlight_boxes.append((x, y, w, h))
    
    return flashlight_count, flashlight_boxes

try:
    while True:
        ret, frame = cap.read()
        if not ret: break

        skip_counter += 1

        if skip_counter >= SKIP_FRAMES:
            skip_counter = 0
            
            # 1. CROWD DETECTION - LOCAL INFERENCE
            results = model.predict(frame)
            predictions = results.predictions
            last_detections = len(predictions)

            # Draw bounding boxes for people
            for pred in predictions:
                x_min = int(pred.x - pred.width / 2)
                y_min = int(pred.y - pred.height / 2)
                x_max = int(pred.x + pred.width / 2)
                y_max = int(pred.y + pred.height / 2)
                
                cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
                confidence = pred.confidence if hasattr(pred, 'confidence') else 0
                cv2.putText(frame, f"Person {confidence:.2f}", (x_min, y_min - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

            # 2. FLASHLIGHT DETECTION
            last_flashlights, flashlight_boxes = detect_flashlights(frame)
            
            # Draw bounding boxes for flashlights
            for (x, y, w, h) in flashlight_boxes:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                cv2.putText(frame, "FLASHLIGHT", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            # --- FIREBASE BROADCAST ---
            cv2.imwrite("live_snapshot.jpg", frame)
            blob = bucket.blob("live_feed.jpg")
            blob.upload_from_filename("live_snapshot.jpg")
            blob.make_public()
            
            # Update stats in Realtime Database
            db_ref.set({
                "crowd_count": last_detections,
                "flashlight_detected": last_flashlights > 0,
                "flashlight_count": last_flashlights,
                "image_url": blob.public_url,
                "timestamp": int(time.time()),
                "status": "DANGER" if (last_detections > 10 or last_flashlights > 0) else "SAFE"
            })

        # Local Preview
        cv2.putText(frame, f"PEOPLE: {last_detections} | FLASHLIGHTS: {last_flashlights} | Press 'q' to quit", 
                    (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.imshow("Live Crowd + Flashlight Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

finally:
    cap.release()
    cv2.destroyAllWindows()