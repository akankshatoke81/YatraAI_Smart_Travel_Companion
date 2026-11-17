"""
YatraAI - Script 07: Image Prediction & Visual Bounding Box Test Script
Accepts an input monument photograph, detects the landmark via YOLO11n,
displays predicted monument name and confidence percentage,
annotates bounding boxes onto the image, and saves the annotated result.
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional

def predict_and_annotate_monument(
    image_path: str,
    weights_path: str = "../models/best.pt",
    conf_threshold: float = 0.40,
    output_image_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Runs landmark detection on a test photograph and renders labeled bounding boxes.
    """
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package not installed. Run: pip install ultralytics")
        sys.exit(1)

    img_file = Path(image_path)
    if not img_file.exists():
        print(f"[ERROR] Target image '{image_path}' not found.")
        return {"success": False, "error": f"Image '{image_path}' not found."}

    model_file = Path(weights_path)
    if not model_file.exists():
        # Fallback check inside ml_pipeline/runs
        fallback = Path(__file__).resolve().parent.parent / "runs" / "train" / "yatraai_yolo11n_monuments" / "weights" / "best.pt"
        if fallback.exists():
            model_file = fallback
        else:
            print(f"[ERROR] Trained weights file '{weights_path}' not found.")
            return {"success": False, "error": f"Weights file '{weights_path}' not found."}

    # Load OpenCV image
    img = cv2.imread(str(img_file))
    if img is None:
        return {"success": False, "error": "Invalid or unreadable image file."}

    orig_h, orig_w = img.shape[:2]

    # Initialize model and run inference
    model = YOLO(str(model_file))
    results = model.predict(source=img, conf=conf_threshold, verbose=False)

    detections = []
    annotated_img = img.copy()

    # Distinct vibrant colors for visualization
    colors = [
        (0, 215, 255),   # Cyan
        (255, 144, 30),  # Blue
        (50, 205, 50),   # Lime Green
        (180, 105, 255), # Pink/Purple
        (0, 165, 255),   # Orange
        (238, 130, 238), # Violet
        (255, 215, 0),   # Gold
    ]

    if results and len(results) > 0 and len(results[0].boxes) > 0:
        names = results[0].names

        for idx, box in enumerate(results[0].boxes):
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = xyxy

            landmark_name = names.get(cls_id, f"Landmark_{cls_id}")
            color = colors[cls_id % len(colors)]

            # Draw bounding box
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 3)

            # Build label text: Name + Confidence %
            label_text = f"{landmark_name}: {conf * 100:.1f}%"

            # Draw filled label background header
            (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            label_y = max(y1 - 10, text_h + 10)
            cv2.rectangle(
                annotated_img,
                (x1, label_y - text_h - 6),
                (x1 + text_w + 10, label_y + 4),
                color,
                -1
            )
            # Draw label text
            cv2.putText(
                annotated_img,
                label_text,
                (x1 + 5, label_y - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (15, 15, 15),
                2,
                cv2.LINE_AA
            )

            detections.append({
                "class_id": cls_id,
                "landmark_name": landmark_name,
                "confidence": round(conf, 4),
                "confidence_percent": f"{conf * 100:.1f}%",
                "bbox_xyxy": [int(x1), int(y1), int(x2), int(y2)]
            })

    # Save output annotated image if destination provided
    if output_image_path is None:
        output_image_path = str(img_file.parent / f"{img_file.stem}_detected.jpg")

    cv2.imwrite(output_image_path, annotated_img)

    # Print summary to console
    print("=" * 60)
    print("YatraAI: Landmark Inference Results")
    print(f"Target Image : {img_file.name} ({orig_w}x{orig_h})")
    print(f"Weights Used : {model_file.name}")
    print(f"Detections   : {len(detections)} monument(s) identified")
    print("-" * 60)

    for i, d in enumerate(detections):
        print(f"[{i + 1}] Monument: {d['landmark_name']}")
        print(f"    Confidence: {d['confidence_percent']}")
        print(f"    Bounding Box (x1, y1, x2, y2): {d['bbox_xyxy']}")

    if not detections:
        print("No supported monument identified above confidence threshold.")

    print(f"\nAnnotated visual result saved to: {Path(output_image_path).resolve()}")
    print("=" * 60)

    return {
        "success": True,
        "image_file": str(img_file.resolve()),
        "output_image": str(Path(output_image_path).resolve()),
        "detections_count": len(detections),
        "detections": detections
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Test YOLO landmark prediction on an image")
    parser.add_argument("image", help="Path to input photograph (JPG/PNG)")
    parser.add_argument("--weights", default="../models/best.pt", help="Path to best.pt weights")
    parser.add_argument("--conf", type=float, default=0.40, help="Confidence threshold (default: 0.40)")
    parser.add_argument("--output", default=None, help="Path to save annotated output image")
    args = parser.parse_args()

    predict_and_annotate_monument(
        image_path=args.image,
        weights_path=args.weights,
        conf_threshold=args.conf,
        output_image_path=args.output
    )

