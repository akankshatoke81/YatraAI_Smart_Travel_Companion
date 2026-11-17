"""
YatraAI - Script 05: Ultralytics YOLO11n Model Training
Trains lightweight YOLO11n on the Maharashtra Monuments Dataset.
Config: 100 epochs, 640px image size, auto-device (CUDA/MPS/CPU),
Cosine LR decay, and automatic export of best.pt to backend/models/best.pt.
"""

import os
import sys
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATASET_DIR = SCRIPT_DIR / "YatraAI_Maharashtra_Dataset"
DEFAULT_DATA_YAML = DEFAULT_DATASET_DIR / "data.yaml"
PIPELINE_YAML = SCRIPT_DIR / "data.yaml"

def train_yolo11n_monuments(
    data_yaml_path: str = str(DEFAULT_DATA_YAML),
    base_model: str = "yolo11n.pt",
    epochs: int = 100,
    imgsz: int = 640,
    batch_size: int = 16,
    project_dir: str = "./runs/train",
    experiment_name: str = "yatraai_yolo11n_monuments",
    app_models_dir: str = "../models"
):
    try:
        import torch
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] Please install PyTorch and Ultralytics:")
        print("  pip install torch torchvision ultralytics")
        sys.exit(1)

    yaml_file = Path(data_yaml_path)
    if not yaml_file.exists():
        if DEFAULT_DATA_YAML.exists():
            yaml_file = DEFAULT_DATA_YAML
        elif PIPELINE_YAML.exists():
            yaml_file = PIPELINE_YAML
        elif (SCRIPT_DIR / data_yaml_path).exists():
            yaml_file = SCRIPT_DIR / data_yaml_path
        else:
            print(f"[ERROR] Dataset configuration '{data_yaml_path}' not found.")
            print("Please run script 04 (split_dataset.py) first to generate YatraAI_Maharashtra_Dataset/.")
            sys.exit(1)

    # Ensure path in yaml is an absolute posix path so Ultralytics does not redirect to datasets_dir
    try:
        import re
        with open(yaml_file, "r", encoding="utf-8") as f:
            y_text = f.read()
        match = re.search(r"^path:\s*(.*)$", y_text, re.MULTILINE)
        if match:
            curr_p = match.group(1).strip().strip("'\"")
            if (not Path(curr_p).is_dir() or curr_p in [".", "./YatraAI_Maharashtra_Dataset"]) and DEFAULT_DATASET_DIR.is_dir():
                abs_p = DEFAULT_DATASET_DIR.resolve().as_posix()
                y_text = re.sub(r"^path:\s*.*$", f"path: {abs_p}", y_text, flags=re.MULTILINE)
                with open(yaml_file, "w", encoding="utf-8") as f:
                    f.write(y_text)
    except Exception as e:
        print(f"Notice during yaml path validation: {e}")

    # Determine optimal compute hardware
    if torch.cuda.is_available():
        device = "0"
        device_name = torch.cuda.get_device_name(0)
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = "mps"
        device_name = "Apple Silicon MPS"
    else:
        device = "cpu"
        device_name = "System CPU (Recommend batch=4-8 or Google Colab T4 GPU)"
        if batch_size > 8:
            batch_size = 8  # Safe default on CPU

    print("=" * 70)
    print("YatraAI: Ultralytics YOLO11n Maharashtra Monument Training Engine")
    print(f"Architecture : {base_model}")
    print(f"Dataset      : {yaml_file.resolve()}")
    print(f"Compute Unit : {device_name} (device='{device}')")
    print(f"Epochs       : {epochs}")
    print(f"Resolution   : {imgsz}x{imgsz}")
    print(f"Batch Size   : {batch_size}")
    print("=" * 70)

    # Initialize YOLO11n
    print(f"\n[1/3] Loading base model '{base_model}'...")
    try:
        model = YOLO(base_model)
    except Exception as e:
        print(f"Notice: Could not load remote {base_model} directly ({e}). Initializing architecture.")
        model = YOLO("yolo11n.yaml")

    # Launch Training Loop
    print("\n[2/3] Launching 100-Epoch Training Cycle...")
    results = model.train(
        data=str(yaml_file.resolve()),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        project=project_dir,
        name=experiment_name,
        patience=20,  # Early stopping if no improvement for 20 epochs
        save=True,
        save_period=10,
        plots=True,
        verbose=True,
        # Standard object detection augmentations
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        fliplr=0.5,
        mosaic=1.0
    )

    # Export best model
    print("\n[3/3] Training cycle completed! Locating top checkpoint...")
    best_weights = Path(project_dir) / experiment_name / "weights" / "best.pt"

    if best_weights.exists():
        print(f"  -> Found verified best weights at: {best_weights.resolve()}")

        # Copy to YatraAI application models directory
        app_target = Path(app_models_dir) / "best.pt"
        app_target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(best_weights, app_target)
        print(f"  -> Successfully deployed to YatraAI application: {app_target.resolve()}")
    else:
        print("  -> Notice: Weights directory output:", list(Path(project_dir).glob("**/*.pt")))

    print("\n" + "=" * 70)
    print("YOLO11n Training & Deployment Pipeline Finished.")
    print("Run script 06 (evaluate_model.py) to assess test metrics.")
    print("=" * 70)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train YOLO11n model on Maharashtra Landmarks")
    parser.add_argument("--data", default=str(DEFAULT_DATA_YAML), help="Path to data.yaml")
    parser.add_argument("--model", default="yolo11n.pt", help="Base model weights or architecture")
    parser.add_argument("--epochs", type=int, default=100, help="Number of epochs (default: 100)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size (default: 640)")
    parser.add_argument("--batch", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--project", default="./runs/train", help="Training runs project folder")
    parser.add_argument("--name", default="yatraai_yolo11n_monuments", help="Experiment name")
    parser.add_argument("--app-models", default="../models", help="Application models deployment directory")
    args = parser.parse_args()

    train_yolo11n_monuments(
        data_yaml_path=args.data,
        base_model=args.model,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch_size=args.batch,
        project_dir=args.project,
        experiment_name=args.name,
        app_models_dir=args.app_models
    )

