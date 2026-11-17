import os
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional, List
from pathlib import Path
from app.core.config import settings

# Supported Maharashtra Landmarks (29 Classes for YOLO11n Dataset & Detector)
SUPPORTED_LANDMARKS = [
    "Raigad Fort",
    "Shivneri Fort",
    "Sinhagad Fort",
    "Pratapgad Fort",
    "Aga Khan Palace",
    "Gateway of India",
    "Ajanta Caves",
    "Ellora Caves",
    "Daulatabad Fort",
    "Shaniwar Wada",
    "Mahalaxmi Temple",
    "Dagdusheth Halwai Ganpati Temple",
    "Marine Drive",
    "Elephanta Caves",
    "Thoseghar Waterfall",
    "Rankala Lake",
    "Ganpatipule Beach",
    "Tarkarli Beach",
    "Trimbakeshwar Temple",
    "Panhala Fort",
    "Sindhudurg Fort",
    "Vijaydurg Fort",
    "Lohagad Fort",
    "Torna Fort",
    "Bibi Ka Maqbara",
    "Bhimashankar Temple",
    "Pandharpur Vitthal Temple",
    "Grishneshwar Temple",
    "Kanheri Caves"
]

class YOLOLandmarkDetector:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.model_path = Path(settings.YOLO_MODEL_PATH)
        self.confidence_threshold = 0.50
        self._load_model()

    def _load_model(self):
        """Attempts to load trained YOLO model weights from configured path."""
        if self.model_path.exists() and self.model_path.stat().st_size > 1000:
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(self.model_path))
                self.model_loaded = True
                print(f"[YOLO] Successfully loaded landmark model weights from: {self.model_path}")
            except Exception as e:
                print(f"[YOLO] Error loading YOLO model weights from {self.model_path}: {e}")
                self.model = None
                self.model_loaded = False
        else:
            print(f"[YOLO] Notice: Trained YOLO weights file not found at {self.model_path}")
            self.model = None
            self.model_loaded = False

    def detect_landmark(self, image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Runs landmark recognition on the provided image bytes.
        Preprocesses image with OpenCV, runs inference through YOLO if configured,
        and returns detection results with confidence score and bounding box.
        """
        try:
            # 1. Check if trained model weights are configured
            if not self.model_loaded or self.model is None:
                # Reload check in case weights were placed recently
                if self.model_path.exists() and self.model_path.stat().st_size > 1000:
                    self._load_model()

            if not self.model_loaded or self.model is None:
                return {
                    "status": "not_configured",
                    "recognized": False,
                    "landmark_name": None,
                    "confidence": 0.0,
                    "bounding_box": None,
                    "model_used": "YOLO Landmark Detector",
                    "message": "Landmark detection model is not configured. Please place the trained weights file (best.pt) in backend/models/."
                }

            # 2. Decode image using OpenCV
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return {
                    "status": "error",
                    "recognized": False,
                    "landmark_name": None,
                    "confidence": 0.0,
                    "bounding_box": None,
                    "model_used": "OpenCV Image Decoder",
                    "message": "Invalid or corrupted image format. Please upload a clear JPG, JPEG, PNG, or WEBP photo."
                }

            h, w = img.shape[:2]
            if h < 100 or w < 100:
                return {
                    "status": "error",
                    "recognized": False,
                    "landmark_name": None,
                    "confidence": 0.0,
                    "bounding_box": None,
                    "model_used": "OpenCV Preprocessing",
                    "message": "Image resolution is too low (minimum 100x100 pixels required) for reliable landmark detection."
                }

            # 3. Run YOLO inference
            results = self.model.predict(source=img, conf=self.confidence_threshold, verbose=False)

            if results and len(results) > 0 and len(results[0].boxes) > 0:
                # Pick the highest confidence detection
                best_box = None
                best_conf = 0.0
                best_cls = -1

                for b in results[0].boxes:
                    conf = float(b.conf[0].item())
                    if conf > best_conf:
                        best_conf = conf
                        best_box = b
                        best_cls = int(b.cls[0].item())

                if best_box is not None and best_conf >= self.confidence_threshold:
                    names = results[0].names
                    predicted_name = names.get(best_cls, "Unknown Landmark")
                    xyxy = [float(round(c, 1)) for c in best_box.xyxy[0].tolist()]

                    # Check if predicted class is in supported landmarks or matchable
                    matched_landmark = None
                    for sl in SUPPORTED_LANDMARKS:
                        if sl.lower() in predicted_name.lower() or predicted_name.lower() in sl.lower():
                            matched_landmark = sl
                            break

                    final_name = matched_landmark if matched_landmark else predicted_name

                    return {
                        "status": "success",
                        "recognized": True,
                        "landmark_name": final_name,
                        "confidence": round(best_conf, 3),
                        "bounding_box": xyxy,
                        "model_used": f"YOLO Landmark Detector ({self.model_path.name})",
                        "message": f"Successfully identified {final_name} with {round(best_conf * 100, 1)}% confidence."
                    }

            # If no boxes detected with sufficient confidence
            return {
                "status": "not_recognized",
                "recognized": False,
                "landmark_name": None,
                "confidence": 0.0,
                "bounding_box": None,
                "model_used": f"YOLO Landmark Detector ({self.model_path.name})",
                "message": "Landmark not recognized. No supported Maharashtra landmark was detected with sufficient confidence (threshold >= 50%)."
            }

        except Exception as e:
            return {
                "status": "error",
                "recognized": False,
                "landmark_name": None,
                "confidence": 0.0,
                "bounding_box": None,
                "model_used": "Error Handler",
                "message": f"Detection error: {str(e)}"
            }

yolo_detector = YOLOLandmarkDetector()
