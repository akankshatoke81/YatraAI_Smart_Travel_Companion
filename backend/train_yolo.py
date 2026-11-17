"""
YatraAI - YOLO Landmark Detection Training Pipeline
Trains a custom YOLOv8n (nano) lightweight model on Maharashtra Landmark Dataset.

Dataset structure required in ./data/landmarks:
  data/landmarks/
    data.yaml
    train/
      images/
      labels/
    val/
      images/
      labels/

Example data.yaml:
  path: ../data/landmarks
  train: train/images
  val: val/images
  names:
    0: Gateway of India
    1: Shaniwar Wada
    2: Sinhagad Fort
    3: Aga Khan Palace
    4: Pratapgad Fort
    5: Mahalaxmi Temple
    6: Dagdusheth Halwai Ganpati Temple
    7: Marine Drive
    8: Elephanta Caves
    9: Thoseghar Waterfall
    10: Rankala Lake
    11: Ganpatipule Beach
    12: Tarkarli Beach
    13: Ajanta Caves
    14: Ellora Caves
    15: Trimbakeshwar Temple
"""

import os
import sys
from pathlib import Path

def train_landmark_model(
    data_yaml_path: str = "./data/landmarks/data.yaml",
    epochs: int = 50,
    imgsz: int = 640,
    batch_size: int = 16,
    output_dir: str = "./models"
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package is not installed. Please run: pip install ultralytics")
        sys.exit(1)

    print("=" * 60)
    print("YatraAI - YOLO Nano Landmark Training Script")
    print("Target: Maharashtra Cultural & Historical Heritage Monuments")
    print("=" * 60)

    data_path = Path(data_yaml_path)
    if not data_path.exists():
        print(f"\n[INFO] Dataset config '{data_yaml_path}' not found.")
        print("To train a custom YOLO model:")
        print("1. Collect 50-100 photos per landmark (Gateway of India, Shaniwar Wada, etc.)")
        print("2. Label bounding boxes in YOLO format (using LabelImg or Roboflow)")
        print("3. Place YAML config file at:", data_path.resolve())
        print("4. Re-run: python train_yolo.py --data ./data/landmarks/data.yaml")
        print("\nCreating a sample data.yaml template for Maharashtra landmarks...")

        data_path.parent.mkdir(parents=True, exist_ok=True)
        sample_yaml = """# YatraAI Maharashtra Monuments Dataset Config
path: ./data/landmarks
train: train/images
val: val/images

names:
  0: Gateway of India
  1: Shaniwar Wada
  2: Sinhagad Fort
  3: Aga Khan Palace
  4: Pratapgad Fort
  5: Mahalaxmi Temple
  6: Dagdusheth Halwai Ganpati Temple
  7: Marine Drive
  8: Elephanta Caves
  9: Thoseghar Waterfall
  10: Rankala Lake
  11: Ganpatipule Beach
  12: Tarkarli Beach
  13: Ajanta Caves
  14: Ellora Caves
  15: Trimbakeshwar Temple
"""
        with open(data_path, "w") as f:
            f.write(sample_yaml)
        print(f"Sample configuration written to {data_path}")
        return

    # Load baseline lightweight pretrained YOLOv8n
    print(f"\n[1/3] Loading lightweight YOLOv8n baseline model...")
    model = YOLO("yolov8n.pt")

    # Train model
    print(f"[2/3] Training for {epochs} epochs at image size {imgsz}...")
    results = model.train(
        data=str(data_path),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        name="yatraai_monuments",
        project=output_dir,
        device="cpu"  # or '0' if NVIDIA GPU available
    )

    # Save target best weights
    best_weights = Path(output_dir) / "yatraai_monuments" / "weights" / "best.pt"
    target_weights = Path(output_dir) / "best.pt"
    if best_weights.exists():
        import shutil
        shutil.copy(best_weights, target_weights)
        print(f"\n[3/3] Training Complete! Best weights exported to {target_weights}")
    else:
        print("\n[3/3] Training finished.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train custom YOLO landmark detector for YatraAI")
    parser.add_argument("--data", default="./data/landmarks/data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=30, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    args = parser.parse_args()

    train_landmark_model(
        data_yaml_path=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch_size=args.batch
    )

