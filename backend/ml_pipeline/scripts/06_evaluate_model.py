"""
YatraAI - Script 06: Model Evaluation & Benchmark Metrics
Evaluates trained YOLO11n weights on the unseen test partition.
Outputs Precision, Recall, mAP@0.50, and mAP@0.50-0.95 with per-class breakdown.
"""

import os
import sys
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATASET_DIR = SCRIPT_DIR / "YatraAI_Maharashtra_Dataset"
DEFAULT_DATA_YAML = DEFAULT_DATASET_DIR / "data.yaml"
PIPELINE_YAML = SCRIPT_DIR / "data.yaml"

def evaluate_monument_model(
    weights_path: str = "./runs/train/yatraai_yolo11n_monuments/weights/best.pt",
    data_yaml_path: str = str(DEFAULT_DATA_YAML),
    split: str = "test",
    imgsz: int = 640,
    output_report_path: str = "./runs/evaluation_report.json"
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package not installed. Run: pip install ultralytics")
        sys.exit(1)

    model_file = Path(weights_path)
    if not model_file.exists():
        # Check fallback to application models
        fallback = Path(__file__).resolve().parent.parent.parent / "models" / "best.pt"
        if fallback.exists():
            model_file = fallback
        else:
            print(f"[ERROR] Trained weights file '{weights_path}' not found.")
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
            sys.exit(1)

    print("=" * 70)
    print("YatraAI: YOLO11n Model Evaluation & Benchmark Report")
    print(f"Weights : {model_file.resolve()}")
    print(f"Dataset : {yaml_file.resolve()}")
    print(f"Split   : {split}")
    print("=" * 70)

    model = YOLO(str(model_file))

    # Run validation mode on the requested split
    metrics = model.val(
        data=str(yaml_file.resolve()),
        split=split,
        imgsz=imgsz,
        plots=True,
        verbose=True
    )

    # Extract primary metrics
    mp = float(metrics.box.mp) if hasattr(metrics.box, "mp") else 0.0
    mr = float(metrics.box.mr) if hasattr(metrics.box, "mr") else 0.0
    map50 = float(metrics.box.map50) if hasattr(metrics.box, "map50") else 0.0
    map50_95 = float(metrics.box.map) if hasattr(metrics.box, "map") else 0.0

    print("\n" + "=" * 70)
    print("OVERALL DETECTION BENCHMARK RESULTS:")
    print(f"  Precision (P)       : {mp * 100:.2f}%")
    print(f"  Recall (R)          : {mr * 100:.2f}%")
    print(f"  mAP @ 0.50          : {map50 * 100:.2f}%")
    print(f"  mAP @ 0.50:0.95     : {map50_95 * 100:.2f}%")
    print("=" * 70)

    # Per-class metrics
    class_names = metrics.names
    per_class_summary = {}
    print("\nPER-CLASS METRICS BREAKDOWN:")
    print(f"{'Class ID':<10} {'Landmark Name':<35} {'mAP50':<12} {'mAP50-95':<12}")
    print("-" * 70)

    if hasattr(metrics.box, "maps") and metrics.box.maps is not None:
        for cls_id, cls_map in enumerate(metrics.box.maps):
            cname = class_names.get(cls_id, f"Class_{cls_id}")
            # Class-specific mAP50 if available, otherwise maps holds mAP50-95
            map_val = float(cls_map)
            per_class_summary[cname] = {
                "class_id": cls_id,
                "mAP50_95": round(map_val, 4)
            }
            print(f"{cls_id:<10} {cname:<35} {map_val * 100:>8.2f}%")

    report_path = Path(output_report_path)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_data = {
        "model_weights": str(model_file.resolve()),
        "split_evaluated": split,
        "overall_metrics": {
            "precision": round(mp, 4),
            "recall": round(mr, 4),
            "mAP50": round(map50, 4),
            "mAP50_95": round(map50_95, 4)
        },
        "per_class": per_class_summary
    }

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print(f"\nDetailed evaluation report saved to: {report_path.resolve()}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Evaluate trained YOLO11n monument detector")
    parser.add_argument("--weights", default="./runs/train/yatraai_yolo11n_monuments/weights/best.pt", help="Path to weights file")
    parser.add_argument("--data", default=str(DEFAULT_DATA_YAML), help="Path to data.yaml")
    parser.add_argument("--split", default="test", choices=["val", "test", "train"], help="Split to evaluate")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--report", default="./runs/evaluation_report.json", help="Path to output report JSON")
    args = parser.parse_args()

    evaluate_monument_model(
        weights_path=args.weights,
        data_yaml_path=args.data,
        split=args.split,
        imgsz=args.imgsz,
        output_report_path=args.report
    )

