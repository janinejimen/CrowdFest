import os
import cv2
from dotenv import load_dotenv
from inference.models.utils import get_roboflow_model

load_dotenv()
API_KEY = os.getenv("ROBOFLOW_API_KEY")

if not API_KEY:
    print("❌ Error: ROBOFLOW_API_KEY not found in .env file")
    exit(1)

print("Loading face detection model...")
MODEL_ID = "face-detection-mik1i/1"
model = get_roboflow_model(
    model_id=MODEL_ID,
    api_key=API_KEY,
)
print("Model loaded.")

cap = cv2.VideoCapture(0)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print(f"🎥 Starting face detection...")
print(f"Camera: {width}x{height}")
print(f"Press 'q' to quit | 's' to save screenshot")

frame_count = 0
face_count = 0

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        
        if frame_count % 3 == 0:
            results = model.predict(frame)
            predictions = results.predictions
            face_count = len(predictions)

            for pred in predictions:
                x_min = int(pred.x - pred.width / 2)
                y_min = int(pred.y - pred.height / 2)
                x_max = int(pred.x + pred.width / 2)
                y_max = int(pred.y + pred.height / 2)
                
                cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
                
                if hasattr(pred, 'confidence'):
                    conf = pred.confidence
                    cv2.putText(frame, f"{conf:.1%}", (x_min, y_min - 5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        cv2.putText(frame, f"Faces: {face_count}", (20, 50), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 2)
        cv2.putText(frame, "Press 'q' to quit | 's' to save", (20, height - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

        cv2.imshow("Face Detection (Local)", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("s"):
            filename = f"face_detection_{frame_count}.jpg"
            cv2.imwrite(filename, frame)
            print(f"Saved: {filename}")

except KeyboardInterrupt:
    print("\nInterrupted by user")
finally:
    cap.release()
    cv2.destroyAllWindows()
    print("Closed")
