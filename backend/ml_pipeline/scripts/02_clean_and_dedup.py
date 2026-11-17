"""
YatraAI - Script 02: Image Cleaning, Corruption Check & Near-Duplicate Deduplication
Filters out corrupt, unreadable, or low-resolution images.
Employs 64-bit Perceptual Difference Hashing (dHash) to purge near-duplicate photographs.
"""

import os
import sys
import json
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Set, Optional, Any
import cv2
import numpy as np

def compute_dhash(image_path: Path, hash_size: int = 8) -> int:
    """
    Computes a 64-bit difference hash (dHash) for an image.
    Robust against scale, compression artifacts, and minor luminance shifts.
    """
    try:
        # Read image in grayscale mode
        img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            return -1

        # Resize to (width = hash_size + 1, height = hash_size)
        resized = cv2.resize(img, (hash_size + 1, hash_size), interpolation=cv2.INTER_AREA)

        # Compute differences between adjacent columns
        diff = resized[:, 1:] > resized[:, :-1]

        # Convert boolean array to 64-bit integer
        return sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])
    except Exception:
        return -1

def hamming_distance(hash1: int, hash2: int) -> int:
    """Calculates the bitwise Hamming distance between two 64-bit hashes."""
    return bin(hash1 ^ hash2).count("1")

SCRIPT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_RAW_DIR = SCRIPT_DIR / "data" / "raw_downloads"
DEFAULT_CLEANED_DIR = SCRIPT_DIR / "data" / "cleaned_images"

def clean_and_deduplicate(
    input_dir: str = str(DEFAULT_RAW_DIR),
    output_dir: str = str(DEFAULT_CLEANED_DIR),
    min_resolution: int = 400,
    hamming_threshold: int = 4,
    class_ids: Optional[List[int]] = None
):
    """
    Performs corruption validation, resolution thresholding, and perceptual deduplication.
    """
    in_path = Path(input_dir)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    if not in_path.exists():
        print(f"[ERROR] Input directory '{input_dir}' does not exist.")
        sys.exit(1)

    print("=" * 70)
    print("YatraAI: Image Cleaning & Perceptual Deduplication Engine")
    print(f"Minimum Resolution: {min_resolution}x{min_resolution} px")
    print(f"Near-Duplicate Hamming Distance Threshold: <= {hamming_threshold} bits")
    print("=" * 70)

    class_dirs = sorted([d for d in in_path.iterdir() if d.is_dir()])
    if class_ids is not None:
        filtered_dirs = []
        for d in class_dirs:
            prefix = d.name.split("_")[0]
            if prefix.isdigit() and int(prefix) in class_ids:
                filtered_dirs.append(d)
        class_dirs = filtered_dirs

    total_processed = 0
    total_corrupted = 0
    total_low_res = 0
    total_duplicates = 0
    total_retained = 0

    hash_registry: Dict[str, int] = {}
    manifest_file = out_path / "hash_registry.json"
    cleaned_manifest: Dict[str, Any] = {}
    if manifest_file.exists():
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                cleaned_manifest = json.load(f)
        except Exception:
            cleaned_manifest = {}

    for cdir in class_dirs:
        class_name = cdir.name
        dest_cdir = out_path / class_name
        dest_cdir.mkdir(parents=True, exist_ok=True)

        img_files = sorted(list(cdir.glob("*.jpg")) + list(cdir.glob("*.png")) + list(cdir.glob("*.jpeg")))
        print(f"\nProcessing class '{class_name}' ({len(img_files)} candidate images)...")

        retained_for_class: List[Tuple[Path, int]] = []

        for img_path in img_files:
            total_processed += 1

            # 1. Check decodability
            try:
                img = cv2.imread(str(img_path))
                if img is None:
                    total_corrupted += 1
                    continue
                h, w = img.shape[:2]
            except Exception:
                total_corrupted += 1
                continue

            # 2. Minimum resolution filter
            if h < min_resolution or w < min_resolution:
                total_low_res += 1
                continue

            # 3. Perceptual hashing (dHash)
            dhash_val = compute_dhash(img_path)
            if dhash_val == -1:
                total_corrupted += 1
                continue

            # Check Hamming distance against already accepted images in this class
            is_dup = False
            for accepted_path, accepted_hash in retained_for_class:
                dist = hamming_distance(dhash_val, accepted_hash)
                if dist <= hamming_threshold:
                    is_dup = True
                    total_duplicates += 1
                    break

            if not is_dup:
                retained_for_class.append((img_path, dhash_val))
                dest_file = dest_cdir / img_path.name
                shutil.copy2(img_path, dest_file)
                hash_registry[img_path.name] = dhash_val
                cleaned_manifest[img_path.name] = {
                    "class": class_name,
                    "resolution": [w, h],
                    "dhash": hex(dhash_val)
                }

        print(f"  -> Retained {len(retained_for_class)} clean, unique images.")
        total_retained += len(retained_for_class)

    # Save hash registry for downstream splitting (prevents split leakage)
    with open(out_path / "hash_registry.json", "w", encoding="utf-8") as f:
        json.dump(cleaned_manifest, f, indent=2)

    print("\n" + "=" * 70)
    print("Deduplication & Cleaning Summary:")
    print(f"  Total Raw Images Inspected : {total_processed}")
    print(f"  Corrupted / Unreadable     : {total_corrupted}")
    print(f"  Below Resolution Floor     : {total_low_res}")
    print(f"  Identical / Near Duplicates: {total_duplicates}")
    print(f"  Clean Verified Retained    : {total_retained}")
    print(f"  Output Directory           : {out_path.resolve()}")
    print("=" * 70)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Clean images and remove near-duplicates using perceptual hashing")
    parser.add_argument("--input", default=str(DEFAULT_RAW_DIR), help="Input raw downloads directory")
    parser.add_argument("--output", default=str(DEFAULT_CLEANED_DIR), help="Output directory for cleaned images")
    parser.add_argument("--min-res", type=int, default=400, help="Minimum width and height in pixels")
    parser.add_argument("--hamming", type=int, default=4, help="Hamming distance threshold for duplicates")
    parser.add_argument("--class-ids", type=str, default="", help="Comma-separated or range of class IDs, e.g. '19-28' or '19,20,21'")
    args = parser.parse_args()

    filter_ids = None
    if args.class_ids:
        filter_ids = []
        for part in args.class_ids.split(","):
            part = part.strip()
            if "-" in part:
                start_s, end_s = part.split("-", 1)
                filter_ids.extend(range(int(start_s), int(end_s) + 1))
            elif part.isdigit():
                filter_ids.append(int(part))

    clean_and_deduplicate(
        input_dir=args.input,
        output_dir=args.output,
        min_resolution=args.min_res,
        hamming_threshold=args.hamming,
        class_ids=filter_ids
    )

