"""
YatraAI - Script 03: YOLO Bounding Box Annotation Verification & Proposal Helper
Generates candidate monument bounding boxes using visual structure / contour saliency,
converts coordinates to normalized YOLO format (<class_id> <x_center> <y_center> <width> <height>),
and rigorously validates existing labels against out-of-bounds errors.
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional

def validate_yolo_label(label_path: Path, num_classes: int = 29) -> Tuple[bool, str]:
    """
    Validates a YOLO label file.
    Ensures format: <class_id> <x_center> <y_center> <width> <height>
    Checks that all coordinates are strictly within [0.0, 1.0] and class_id is valid.
    """
    if not label_path.exists():
        return False, "Label file does not exist."

    with open(label_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    if not lines:
        return False, "Label file is empty (no bounding boxes defined)."

    for line_idx, line in enumerate(lines):
        parts = line.strip().split()
        if len(parts) != 5:
            return False, f"Line {line_idx + 1}: Expected 5 values, got {len(parts)}: '{line.strip()}'"

        try:
            class_id = int(parts[0])
            xc = float(parts[1])
            yc = float(parts[2])
            w = float(parts[3])
            h = float(parts[4])
        except ValueError:
            return False, f"Line {line_idx + 1}: Non-numeric value encountered: '{line.strip()}'"

        if class_id < 0 or class_id >= num_classes:
            return False, f"Line {line_idx + 1}: Class ID {class_id} outside valid range [0, {num_classes - 1}]."

        if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 < w <= 1.0 and 0.0 < h <= 1.0):
            return False, f"Line {line_idx + 1}: Normalized coordinates out of [0.0, 1.0] bounds: xc={xc}, yc={yc}, w={w}, h={h}."

    return True, "Valid"

def propose_monument_bbox(image_path: Path) -> Optional[Tuple[float, float, float, float]]:
    """
    Computes a prominent architectural saliency bounding box using contour analysis.
    Serves as an initial proposal for human annotators in CVAT/LabelImg.
    Returns normalized (xc, yc, w, h).
    """
    img = cv2.imread(str(image_path))
    if img is None:
        return None

    img_h, img_w = img.shape[:2]

    # Convert to grayscale and apply Gaussian blur
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive edge detection for architectural structures
    edges = cv2.Canny(blurred, 50, 150)

    # Dilate edges to close gaps in monument silhouettes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    dilated = cv2.dilate(edges, kernel, iterations=2)

    # Find external contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        # Fallback to central region (75% frame)
        return 0.5, 0.5, 0.75, 0.75

    # Filter significant contours (ignoring tiny noise)
    valid_boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w * h > (img_w * img_h * 0.05):  # At least 5% of image area
            valid_boxes.append((x, y, x + w, y + h))

    if not valid_boxes:
        return 0.5, 0.5, 0.80, 0.80

    # Merge bounding boxes of significant architectural elements
    min_x = min(b[0] for b in valid_boxes)
    min_y = min(b[1] for b in valid_boxes)
    max_x = max(b[2] for b in valid_boxes)
    max_y = max(b[3] for b in valid_boxes)

    # Convert to normalized YOLO format
    box_w = max_x - min_x
    box_h = max_y - min_y
    xc = (min_x + box_w / 2.0) / img_w
    yc = (min_y + box_h / 2.0) / img_h
    norm_w = box_w / img_w
    norm_h = box_h / img_h

    # Clamp to [0, 1]
    xc = min(max(xc, 0.0), 1.0)
    yc = min(max(yc, 0.0), 1.0)
    norm_w = min(max(norm_w, 0.05), 1.0)
    norm_h = min(max(norm_h, 0.05), 1.0)

    return round(xc, 4), round(yc, 4), round(norm_w, 4), round(norm_h, 4)

SCRIPT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_IMAGES_DIR = SCRIPT_DIR / "data" / "cleaned_images"
DEFAULT_LABELS_DIR = SCRIPT_DIR / "data" / "candidate_labels"

def resolve_dir(dir_path: str, fallback_default: Path) -> Path:
    p = Path(dir_path)
    if p.is_dir():
        return p
    candidate = SCRIPT_DIR / dir_path
    if candidate.is_dir():
        return candidate
    if fallback_default.is_dir():
        return fallback_default
    return p

def generate_candidate_labels(
    images_dir: str = str(DEFAULT_IMAGES_DIR),
    labels_dir: str = str(DEFAULT_LABELS_DIR),
    overwrite: bool = False
):
    """
    Generates candidate YOLO annotation labels for human verification.
    Extracts class ID from folder prefixes (e.g. '05_gateway_of_india' -> class 5).
    """
    in_path = resolve_dir(images_dir, DEFAULT_IMAGES_DIR)
    out_path = Path(labels_dir)
    if not out_path.is_absolute() and not out_path.exists():
        candidate_out = SCRIPT_DIR / labels_dir
        if candidate_out.parent.exists():
            out_path = candidate_out
    out_path.mkdir(parents=True, exist_ok=True)

    if not in_path.exists():
        print(f"[ERROR] Cleaned images directory not found at: {in_path.resolve()}")
        sys.exit(1)

    print("=" * 70)
    print("YatraAI: Candidate Bounding Box Generator (Human-in-the-loop Pipeline)")
    print(f"Source: {in_path.resolve()}")
    print(f"Output: {out_path.resolve()}")
    print("=" * 70)

    class_dirs = sorted([d for d in in_path.iterdir() if d.is_dir()])
    total_generated = 0
    total_existing = 0

    for cdir in class_dirs:
        # Extract class ID from directory name prefix (e.g. '09_shaniwar_wada' -> 9)
        try:
            class_id = int(cdir.name.split("_")[0])
        except ValueError:
            print(f"Skipping non-indexed folder: {cdir.name}")
            continue

        images = list(cdir.glob("*.jpg")) + list(cdir.glob("*.png")) + list(cdir.glob("*.jpeg"))
        print(f"\nGenerating proposals for Class {class_id} ('{cdir.name}') - {len(images)} images...")

        for img_path in images:
            txt_filename = img_path.stem + ".txt"
            label_file = out_path / txt_filename

            if label_file.exists() and not overwrite:
                total_existing += 1
                continue

            bbox = propose_monument_bbox(img_path)
            if bbox:
                xc, yc, w, h = bbox
                with open(label_file, "w", encoding="utf-8") as f:
                    f.write(f"{class_id} {xc:.4f} {yc:.4f} {w:.4f} {h:.4f}\n")
                total_generated += 1

    print("\n" + "=" * 70)
    print(f"Generated {total_generated} candidate label files in YOLO format.")
    if total_existing > 0:
        print(f"Preserved {total_existing} existing label files (use --overwrite to regenerate).")
    print("IMPORTANT: These candidate boxes must be visually inspected and adjusted")
    print("in LabelImg, CVAT, or Roboflow before running training.")
    print("=" * 70)

def verify_dataset_labels(labels_dir: str = str(DEFAULT_LABELS_DIR), num_classes: int = 29):
    """
    Audits all label files in a directory to ensure 100% compliance with YOLO format.
    """
    l_path = resolve_dir(labels_dir, DEFAULT_LABELS_DIR)
    if not l_path.exists():
        print(f"[ERROR] Labels directory '{labels_dir}' does not exist.")
        return

    txt_files = list(l_path.glob("*.txt"))
    print(f"\nAuditing {len(txt_files)} YOLO label files in {l_path}...")

    invalid_count = 0
    for txt in txt_files:
        valid, reason = validate_yolo_label(txt, num_classes=num_classes)
        if not valid:
            invalid_count += 1
            print(f"  [INVALID] {txt.name}: {reason}")

    if invalid_count == 0:
        print(f"All {len(txt_files)} labels PASSED verification! Ready for dataset splitting.")
    else:
        print(f"Found {invalid_count} invalid label files that need correction.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="YOLO bounding box verification and proposal assistant")
    parser.add_argument("--action", choices=["generate", "verify", "all"], default="generate", help="Action to execute")
    parser.add_argument("--images", default=str(DEFAULT_IMAGES_DIR), help="Cleaned images directory")
    parser.add_argument("--labels", default=str(DEFAULT_LABELS_DIR), help="Labels directory")
    parser.add_argument("--num-classes", type=int, default=29, help="Number of YOLO classes (default: 29)")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing label files")
    args = parser.parse_args()

    if args.action == "generate":
        generate_candidate_labels(images_dir=args.images, labels_dir=args.labels, overwrite=args.overwrite)
    elif args.action == "verify":
        verify_dataset_labels(labels_dir=args.labels, num_classes=args.num_classes)
    elif args.action == "all":
        generate_candidate_labels(images_dir=args.images, labels_dir=args.labels, overwrite=args.overwrite)
        verify_dataset_labels(labels_dir=args.labels, num_classes=args.num_classes)

