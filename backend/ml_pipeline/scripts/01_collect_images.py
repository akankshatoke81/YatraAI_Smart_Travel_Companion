"""
YatraAI - Script 01: Wikimedia Commons Image Collector
Collects authentic photographs for 29 Maharashtra historical landmarks.
Tracks source URL, author, resolution, and license (CC-BY, CC-BY-SA, Public Domain).
"""

import os
import sys
import json
import time
import hashlib
import urllib.request
import urllib.parse
from pathlib import Path
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# 29 Landmark Classes with Wikimedia search query variants
LANDMARK_CLASSES = [
    {
        "id": 0,
        "name": "Raigad Fort",
        "queries": ["Raigad Fort", "Raigad Fort Maharashtra", "Maha Darwaja Raigad"]
    },
    {
        "id": 1,
        "name": "Shivneri Fort",
        "queries": ["Shivneri Fort", "Shivneri Fort Junnar", "Shivneri Maharashtra"]
    },
    {
        "id": 2,
        "name": "Sinhagad Fort",
        "queries": ["Sinhagad Fort", "Sinhagad Pune", "Kalyan Darwaja Sinhagad"]
    },
    {
        "id": 3,
        "name": "Pratapgad Fort",
        "queries": ["Pratapgad Fort", "Pratapgad Satara", "Pratapgad Mahabaleshwar"]
    },
    {
        "id": 4,
        "name": "Aga Khan Palace",
        "queries": ["Aga Khan Palace", "Aga Khan Palace Pune"]
    },
    {
        "id": 5,
        "name": "Gateway of India",
        "queries": ["Gateway of India", "Gateway of India Mumbai", "Gateway of India Colaba"]
    },
    {
        "id": 6,
        "name": "Ajanta Caves",
        "queries": ["Ajanta Caves", "Ajanta Cave facade", "Ajanta Chaitya"]
    },
    {
        "id": 7,
        "name": "Ellora Caves",
        "queries": ["Ellora Caves", "Kailasa temple Ellora", "Ellora Cave 16"]
    },
    {
        "id": 8,
        "name": "Daulatabad Fort",
        "queries": ["Daulatabad Fort", "Devagiri Fort Maharashtra", "Chand Minar Daulatabad"]
    },
    {
        "id": 9,
        "name": "Shaniwar Wada",
        "queries": ["Shaniwar Wada", "Shaniwarwada Pune", "Dilli Darwaza Shaniwar Wada"]
    },
    {
        "id": 10,
        "name": "Mahalaxmi Temple",
        "queries": ["Mahalaxmi Temple Kolhapur", "Ambabaie temple Kolhapur"]
    },
    {
        "id": 11,
        "name": "Dagdusheth Halwai Ganpati Temple",
        "queries": ["Dagdusheth Ganpati", "Dagdusheth Halwai temple Pune"]
    },
    {
        "id": 12,
        "name": "Marine Drive",
        "queries": ["Marine Drive Mumbai", "Queen's Necklace Mumbai", "Marine Drive promenade"]
    },
    {
        "id": 13,
        "name": "Elephanta Caves",
        "queries": ["Elephanta Caves", "Elephanta Island Trimurti", "Elephanta Caves sculpture"]
    },
    {
        "id": 14,
        "name": "Thoseghar Waterfall",
        "queries": ["Thoseghar Waterfall", "Thoseghar Waterfalls Satara"]
    },
    {
        "id": 15,
        "name": "Rankala Lake",
        "queries": ["Rankala Lake", "Rankala Lake Kolhapur", "Sandhya Math Rankala"]
    },
    {
        "id": 16,
        "name": "Ganpatipule Beach",
        "queries": ["Ganpatipule Beach", "Ganpatipule temple beach Ratnagiri"]
    },
    {
        "id": 17,
        "name": "Tarkarli Beach",
        "queries": ["Tarkarli Beach", "Tarkarli Sindhudurg", "Tarkarli coastal"]
    },
    {
        "id": 18,
        "name": "Trimbakeshwar Temple",
        "queries": ["Trimbakeshwar Temple", "Trimbakeshwar Shiva temple Nashik"]
    },
    {
        "id": 19,
        "name": "Panhala Fort",
        "queries": ["Panhala Fort", "Panhala Fort Kolhapur", "Teen Darwaza Panhala", "Sajja Kothi Panhala"]
    },
    {
        "id": 20,
        "name": "Sindhudurg Fort",
        "queries": ["Sindhudurg Fort", "Sindhudurg Fort Malvan", "Sindhudurg sea fort"]
    },
    {
        "id": 21,
        "name": "Vijaydurg Fort",
        "queries": ["Vijaydurg Fort", "Vijaydurg Fort Sindhudurg", "Vijaydurg sea fort"]
    },
    {
        "id": 22,
        "name": "Lohagad Fort",
        "queries": ["Lohagad Fort", "Lohagad Fort Maharashtra", "Lohagad Fort Lonavala"]
    },
    {
        "id": 23,
        "name": "Torna Fort",
        "queries": ["Torna Fort", "Prachandagad", "Torna Fort Pune"]
    },
    {
        "id": 24,
        "name": "Bibi Ka Maqbara",
        "queries": ["Bibi Ka Maqbara", "Bibi Ka Maqbara Aurangabad", "Tomb of Rabia Daurani"]
    },
    {
        "id": 25,
        "name": "Bhimashankar Temple",
        "queries": ["Bhimashankar Temple", "Bhimashankar Jyotirlinga", "Bhimashankar Pune"]
    },
    {
        "id": 26,
        "name": "Pandharpur Vitthal Temple",
        "queries": ["Vithoba Temple Pandharpur", "Vitthal Rukmini Temple Pandharpur", "Pandharpur temple"]
    },
    {
        "id": 27,
        "name": "Grishneshwar Temple",
        "queries": ["Grishneshwar Temple", "Grishneshwar Jyotirlinga", "Grishneshwar temple Ellora"]
    },
    {
        "id": 28,
        "name": "Kanheri Caves",
        "queries": ["Kanheri Caves", "Kanheri Caves Mumbai", "Kanheri Caves Chaitya"]
    }
]

WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "YatraAI-Monuments-Dataset-Collector/1.0 (https://github.com/yatraai; student.research@yatraai.local)"

def query_wikimedia_commons(query: str, limit: int = 50, continue_token: str = "") -> Dict[str, Any]:
    """Queries Wikimedia Commons API for image files matching the search query."""
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"{query}",
        "gsrnamespace": "6",  # 6 = File:
        "gsrlimit": str(min(limit, 50)),
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": "1280",
    }
    if continue_token:
        params["gsroffset"] = continue_token

    url = f"{WIKIMEDIA_API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as e:
            if attempt < 2:
                time.sleep(1.5 * (attempt + 1))
            else:
                print(f"  [API Error] Failed to query '{query}' after 3 attempts: {e}", flush=True)
                return {}

def download_single_item(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Downloads an individual image file and returns its metadata record."""
    url = item["download_url"]
    dest_path = item["filepath"]

    if dest_path.exists() and dest_path.stat().st_size > 1024:
        return item["meta"]

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp, open(dest_path, "wb") as f:
            f.write(resp.read())
        return item["meta"]
    except Exception:
        # Fallback to direct url if thumburl failed
        if url != item["orig_url"]:
            try:
                req2 = urllib.request.Request(item["orig_url"], headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req2, timeout=15) as resp2, open(dest_path, "wb") as f2:
                    f2.write(resp2.read())
                return item["meta"]
            except Exception:
                pass
        if dest_path.exists():
            dest_path.unlink()
        return None

SCRIPT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_RAW_DIR = SCRIPT_DIR / "data" / "raw_downloads"

def collect_monument_dataset(
    output_dir: str = str(DEFAULT_RAW_DIR),
    target_per_landmark: int = 20,
    max_workers: int = 4,
    class_ids: Optional[List[int]] = None
):
    base_dir = Path(output_dir)
    base_dir.mkdir(parents=True, exist_ok=True)

    metadata_file = base_dir / "dataset_metadata.json"
    metadata: Dict[str, Any] = {}
    if metadata_file.exists():
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        except Exception:
            metadata = {}

    target_classes = LANDMARK_CLASSES
    if class_ids is not None:
        target_classes = [c for c in LANDMARK_CLASSES if c["id"] in class_ids]

    print("=" * 70, flush=True)
    print("YatraAI: Wikimedia Commons Image Collection Engine", flush=True)
    print(f"Target: {target_per_landmark} images per landmark across {len(target_classes)} target classes", flush=True)
    print(f"Output Directory: {base_dir.resolve()}", flush=True)
    print("=" * 70, flush=True)

    total_downloaded_session = 0

    for idx, landmark in enumerate(target_classes):
        class_id = landmark["id"]
        class_name = landmark["name"]
        slug = class_name.lower().replace(" ", "_").replace("'", "")
        class_dir = base_dir / f"{class_id:02d}_{slug}"
        class_dir.mkdir(parents=True, exist_ok=True)

        existing_images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png")) + list(class_dir.glob("*.jpeg"))
        existing_hashes = {p.stem.split("_")[-1] for p in existing_images}
        print(f"\n[{idx + 1}/{len(target_classes)}] [ID {class_id:02d}] {class_name}", flush=True)
        print(f"  Existing images: {len(existing_images)} / {target_per_landmark}", flush=True)

        if len(existing_images) >= target_per_landmark:
            print("  -> Target count already achieved. Skipping download.", flush=True)
            continue

        collected_for_class = len(existing_images)
        seen_urls = set()
        pending_download_items = []

        for q in landmark["queries"]:
            if collected_for_class + len(pending_download_items) >= target_per_landmark:
                break

            print(f"  Querying: '{q}'...", flush=True)
            data = query_wikimedia_commons(q, limit=25)
            time.sleep(0.5)
            pages = data.get("query", {}).get("pages", {})

            for page_id, page in pages.items():
                if collected_for_class + len(pending_download_items) >= target_per_landmark:
                    break

                image_info_list = page.get("imageinfo", [])
                if not image_info_list:
                    continue

                img_info = image_info_list[0]
                orig_url = img_info.get("url")
                download_url = img_info.get("thumburl") or orig_url
                mime = img_info.get("mime", "")
                orig_w = img_info.get("width", 0)
                orig_h = img_info.get("height", 0)
                width = img_info.get("thumbwidth") or orig_w
                height = img_info.get("thumbheight") or orig_h

                if not download_url or mime not in ["image/jpeg", "image/png"]:
                    continue
                if orig_w < 400 or orig_h < 400 or width < 400 or height < 400:
                    continue
                if orig_url in seen_urls:
                    continue

                url_hash = hashlib.md5(orig_url.encode()).hexdigest()[:10]
                if url_hash in existing_hashes:
                    continue

                seen_urls.add(orig_url)
                ext = ".jpg" if "jpeg" in mime else ".png"
                filename = f"{slug}_{url_hash}{ext}"
                filepath = class_dir / filename

                ext_meta = img_info.get("extmetadata", {})
                artist = ext_meta.get("Artist", {}).get("value", "Unknown Contributor")
                license_name = ext_meta.get("LicenseShortName", {}).get("value", "Public Domain / CC")
                license_url = ext_meta.get("LicenseUrl", {}).get("value", "")

                meta = {
                    "filename": filename,
                    "class_id": class_id,
                    "landmark_name": class_name,
                    "source_url": orig_url,
                    "download_url": download_url,
                    "artist": artist[:120],
                    "license": license_name,
                    "license_url": license_url,
                    "dimensions": [width, height],
                    "download_time": time.strftime("%Y-%m-%d %H:%M:%S")
                }

                pending_download_items.append({
                    "download_url": download_url,
                    "orig_url": orig_url,
                    "filepath": filepath,
                    "meta": meta
                })

        # Execute concurrent downloads for this class
        if pending_download_items:
            print(f"  Downloading {len(pending_download_items)} candidate images concurrently...", flush=True)
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {executor.submit(download_single_item, it): it for it in pending_download_items}
                for f in as_completed(futures):
                    res_meta = f.result()
                    if res_meta:
                        fn = res_meta.pop("filename")
                        metadata[fn] = res_meta
                        collected_for_class += 1
                        total_downloaded_session += 1
                        print(f"    Saved: {fn} ({res_meta['dimensions'][0]}x{res_meta['dimensions'][1]}) [{collected_for_class}/{target_per_landmark}]", flush=True)

        print(f"  Completed: {collected_for_class} images secured for {class_name}.", flush=True)

        # Incrementally update metadata file
        with open(metadata_file, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

    print("\n" + "=" * 70, flush=True)
    print(f"Collection complete! Downloaded {total_downloaded_session} new images this run.", flush=True)
    print(f"Attribution & license catalog recorded to: {metadata_file.resolve()}", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Collect real Maharashtra landmark images from Wikimedia Commons")
    parser.add_argument("--output", default=str(DEFAULT_RAW_DIR), help="Output directory for raw downloads")
    parser.add_argument("--target", type=int, default=5, help="Target images per landmark (default: 5)")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent download workers")
    parser.add_argument("--class-ids", type=str, default="", help="Comma-separated or range of class IDs to collect, e.g. '19-28' or '19,20,21'")
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

    collect_monument_dataset(
        output_dir=args.output,
        target_per_landmark=args.target,
        max_workers=args.workers,
        class_ids=filter_ids
    )
