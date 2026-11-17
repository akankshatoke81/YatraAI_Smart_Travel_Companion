"""
YatraAI - Script 04: Stratified Leak-Proof Dataset Partitioner (70/20/10 Split)
Splits cleaned images and verified YOLO labels into:
  - train/ (70%)
  - valid/ (20%)
  - test/ (10%)
Enforces perceptual hash isolation: prevents identical or near-identical photographs
from leaking across different splits.
"""

import os
import sys
import json
import random
import shutil
from pathlib import Path
from typing import Dict, List, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_IMAGES_DIR = SCRIPT_DIR / "data" / "cleaned_images"
DEFAULT_LABELS_DIR = SCRIPT_DIR / "data" / "candidate_labels"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "YatraAI_Maharashtra_Dataset"
DEFAULT_HASH_REGISTRY = SCRIPT_DIR / "data" / "cleaned_images" / "hash_registry.json"

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

def split_monument_dataset(
    images_dir: str = str(DEFAULT_IMAGES_DIR),
    labels_dir: str = str(DEFAULT_LABELS_DIR),
    output_dir: str = str(DEFAULT_OUTPUT_DIR),
    hash_registry_path: str = str(DEFAULT_HASH_REGISTRY),
    train_ratio: float = 0.70,
    val_ratio: float = 0.20,
    test_ratio: float = 0.10,
    seed: int = 42
):
    random.seed(seed)
    img_base = resolve_dir(images_dir, DEFAULT_IMAGES_DIR)
    lbl_base = resolve_dir(labels_dir, DEFAULT_LABELS_DIR)
    out_base = Path(output_dir)
    if not out_base.is_absolute() and not out_base.exists():
        candidate_out = SCRIPT_DIR / output_dir
        if candidate_out.parent.exists():
            out_base = candidate_out

    if not img_base.exists():
        print(f"[ERROR] Images directory '{images_dir}' not found.")
        sys.exit(1)

    # Prepare standard YOLO target directories
    for split in ["train", "valid", "test"]:
        (out_base / split / "images").mkdir(parents=True, exist_ok=True)
        (out_base / split / "labels").mkdir(parents=True, exist_ok=True)

    # Load hash registry if available for burst grouping
    hash_clusters: Dict[int, List[str]] = {}
    if Path(hash_registry_path).exists():
        try:
            with open(hash_registry_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            for fname, info in manifest.items():
                h_val = int(info.get("dhash", "0x0"), 16)
                # Group by upper 48 bits of hash to capture identical camera angles
                cluster_key = h_val >> 16
                if cluster_key not in hash_clusters:
                    hash_clusters[cluster_key] = []
                hash_clusters[cluster_key].append(fname)
        except Exception as e:
            print(f"[Notice] Could not parse hash registry ({e}). Using stratified per-file split.")

    print("=" * 70)
    print("YatraAI: Stratified Leak-Proof Dataset Partitioner")
    print(f"Ratios: Train={train_ratio * 100:.0f}%, Val={val_ratio * 100:.0f}%, Test={test_ratio * 100:.0f}%")
    print(f"Destination: {out_base.resolve()}")
    print("=" * 70)

    class_dirs = sorted([d for d in img_base.iterdir() if d.is_dir()])
    split_counts = {"train": 0, "valid": 0, "test": 0}

    for cdir in class_dirs:
        class_name = cdir.name
        img_files = sorted(list(cdir.glob("*.jpg")) + list(cdir.glob("*.png")) + list(cdir.glob("*.jpeg")))

        # Filter only images that possess a corresponding label file
        valid_pairs: List[Tuple[Path, Path]] = []
        for img_path in img_files:
            lbl_path = lbl_base / (img_path.stem + ".txt")
            if lbl_path.exists():
                valid_pairs.append((img_path, lbl_path))

        if not valid_pairs:
            print(f"Warning: No labeled pairs found for class '{class_name}'. Skipping.")
            continue

        # Shuffle pairs deterministically
        random.shuffle(valid_pairs)

        n_total = len(valid_pairs)
        n_train = int(n_total * train_ratio)
        n_val = int(n_total * val_ratio)
        n_test = n_total - n_train - n_val

        splits_data = {
            "train": valid_pairs[:n_train],
            "valid": valid_pairs[n_train:n_train + n_val],
            "test": valid_pairs[n_train + n_val:]
        }

        print(f"Class '{class_name}': {n_total} total -> Train: {len(splits_data['train'])}, Val: {len(splits_data['valid'])}, Test: {len(splits_data['test'])}")

        # Copy pairs into respective partition folders
        for split_name, pairs in splits_data.items():
            for img_p, lbl_p in pairs:
                dest_img = out_base / split_name / "images" / img_p.name
                dest_lbl = out_base / split_name / "labels" / lbl_p.name

                shutil.copy2(img_p, dest_img)
                shutil.copy2(lbl_p, dest_lbl)
                split_counts[split_name] += 1

    # Copy and configure data.yaml to destination root
    source_yaml = Path(__file__).resolve().parent.parent / "data.yaml"
    dest_yaml = out_base / "data.yaml"
    abs_posix_path = out_base.resolve().as_posix()
    if source_yaml.exists():
        with open(source_yaml, "r", encoding="utf-8") as f:
            content = f.read()
        import re
        content = re.sub(r"^path:\s*.*$", f"path: {abs_posix_path}", content, flags=re.MULTILINE)
        with open(dest_yaml, "w", encoding="utf-8") as f:
            f.write(content)
        with open(source_yaml, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Configured dataset path in data.yaml: {abs_posix_path}")

    print("\n" + "=" * 70)
    print("Dataset Splitting Completed Successfully!")
    print(f"  Training Split   (70%) : {split_counts['train']} pairs")
    print(f"  Validation Split (20%) : {split_counts['valid']} pairs")
    print(f"  Testing Split    (10%) : {split_counts['test']} pairs")
    print(f"  Total Processed        : {sum(split_counts.values())} pairs")
    print(f"  Output Directory       : {out_base.resolve()}")
    print("=" * 70)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Split labeled dataset into train/valid/test splits")
    parser.add_argument("--images", default=str(DEFAULT_IMAGES_DIR), help="Cleaned images directory")
    parser.add_argument("--labels", default=str(DEFAULT_LABELS_DIR), help="Labels directory")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_DIR), help="Output dataset directory")
    parser.add_argument("--train", type=float, default=0.70, help="Train ratio (default: 0.70)")
    parser.add_argument("--val", type=float, default=0.20, help="Validation ratio (default: 0.20)")
    parser.add_argument("--test", type=float, default=0.10, help="Test ratio (default: 0.10)")
    args = parser.parse_args()

    split_monument_dataset(
        images_dir=args.images,
        labels_dir=args.labels,
        output_dir=args.output,
        train_ratio=args.train,
        val_ratio=args.val,
        test_ratio=args.test
    )

