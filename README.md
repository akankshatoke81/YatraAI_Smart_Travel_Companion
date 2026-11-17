# YatraAI – Smart AI/ML Travel Companion for Maharashtra

> **An AIML Engineering Full-Stack Web Application for Maharashtra Heritage, Route Optimization, Monument Computer Vision, and Camera Augmented Reality.**

---

## 🌟 Executive Overview & Demo Reference

**YatraAI** is a production-ready, full-stack travel companion platform engineered specifically for Maharashtra. Designed as an Artificial Intelligence & Machine Learning (AIML) capstone project, it demonstrates the practical confluence of:

1. **Computer Vision (YOLO)**: Custom lightweight landmark identification for Maharashtra monuments (Shaniwar Wada, Gateway of India, Sinhagad Fort, Aga Khan Palace, Pratapgad, etc.).
2. **Heuristic Graph Pathfinding (A\* Algorithm)**: Road and walking intersection network routing utilizing great-circle Haversine heuristics.
3. **Generative AI Travel Planning (Groq LLaMA-3.3)**: Constraint-aware, budget-optimized personalized itinerary generation grounded strictly in MySQL verified database archives.
4. **Browser Camera AR Guidance**: Augmented reality direction HUD computing real-time Great-Circle azimuth bearings and compass vectors overlaid on live camera feeds.
5. **Offline-First Field Architecture**: IndexedDB client-side synchronization allowing full monument research and coordinate lookups in remote regions with zero internet.
6. **Role-Based Access Control (RBAC)**: Secure multi-tier authentication for Administrators and Travelers.

---

## 📸 Design Specifications (Reference Implementation)

### 1. Homepage Design
- **Theme**: Dark Navy (`#070b16` / `#0b1120`) with cyan and teal illuminated highlights.
- **Header**: Dark navigation bar with translucent backdrop blur (`#0b1329`), glowing branding, and seamless Login/Register options.
- **Hero Title**: *"Your Personal AI Travel Guide with Camera AR"*
- **Hero Subtitle**: *"Discover Maharashtra's heritage, identify monuments through your camera, receive budget-aware itineraries, and navigate with intelligent route guidance."*
- **Primary Actions**:
  - 📍 **Explore Nearby Places** (`/nearby`) – GPS proximity discovery.
  - 📷 **Launch AI Camera Scanner** (`/scanner`) – YOLO monument detection.
  - ✨ **Personalized Recommendations** (`/recommender`) – Groq LLaMA trip optimizer.
  - 📶 **Offline Mode** (`/offline`) – Local IndexedDB bundle viewer.

### 2. Destination Details Design
- High-resolution verified destination photograph with licensing & attribution badge.
- Live distance calculation and estimated driving/walking travel time.
- Entry fee tag (e.g. Free or ₹25) and estimated visiting duration.
- Historical background, cultural significance, and architectural style breakdowns.
- Instant action triggers:
  - 🗺️ **2D Map Navigation** (Leaflet OpenStreetMap with computed A* route)
  - 🧭 **AR Navigation** (Camera live overlay with target compass reticle)
  - ⚡ **Groq AI Cultural Deep-Dive** (grounded explanatory engine)

---

## 🏗️ Technology Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React 18 | High-performance, SEO-friendly component architecture |
| **Styling** | Tailwind CSS & Lucide Icons | Responsive modern UI with glassmorphism and cyan glows |
| **Maps** | Leaflet & OpenStreetMap | Interactive 2D mapping, custom markers, polyline routing |
| **Backend** | Python FastAPI & Uvicorn | Asynchronous high-throughput RESTful API layer |
| **ORM** | SQLAlchemy 2.0 & Pydantic V2 | Type-safe schema validation and database modeling |
| **Database** | MySQL (with SQLite Auto-Fallback) | Persistent relational data store for destinations & users |
| **Computer Vision** | YOLO (Ultralytics) & OpenCV | Custom monument detection & image feature matching |
| **Routing Algorithm** | A\* (A-Star) with Haversine Heuristic | Heuristic road graph shortest path determination |
| **AI Recommender** | Groq API (LLaMA-3.3 70B Versatile) | Structured personalized itinerary generation |
| **Offline Storage** | HTML5 IndexedDB | Zero-network field guide caching |

---

## 🗄️ Database Architecture (MySQL)

Connected via standard `DATABASE_URL=mysql+pymysql://username:password@localhost:3306/yatraai`.

```
                    ┌─────────────┐
                    │   REGIONS   │
                    └──────┬──────┘
                           │ 1:N
                    ┌──────▼──────┐
                    │  DISTRICTS  │
                    └──────┬──────┘
                           │ 1:N
                    ┌──────▼──────┐
   ┌───────────────►│ DESTINATIONS│◄──────────────┐
   │                └─────────────┘               │
   │ 1:N                                          │ 1:N
┌──┴──────────┐                            ┌──────┴────────────────┐
│ FAVOURITES  │                            │ ITINERARY_DESTINATIONS│
└──┬──────────┘                            └──────┬────────────────┘
   │ N:1                                          │ N:1
┌──▼──────────┐                            ┌──────▼──────┐
│    USERS    ├───────────────────────────►│ ITINERARIES │
└─────────────┘          1:N               └─────────────┘
```

### Table Definitions:
1. **`users`**: `id`, `name`, `email`, `age`, `password_hash` (bcrypt), `role` (`admin`/`user`), `is_active`, `created_at`.
2. **`regions`**: `id`, `region_name`, `description`.
3. **`districts`**: `id`, `district_name`, `region_id` (FK -> `regions.id`).
4. **`destinations`**: `id`, `name`, `description`, `district_id` (FK -> `districts.id`), `category`, `latitude`, `longitude`, `entry_fee`, `opening_hours`, `visit_duration`, `history`, `architecture`, `image_path`, `image_source`, `image_attribution`, `created_at`, `updated_at`.
5. **`favourites`**: `id`, `user_id` (FK -> `users.id`), `destination_id` (FK -> `destinations.id`), `created_at`.
6. **`itineraries`**: `id`, `user_id` (FK -> `users.id`), `title`, `starting_location`, `budget`, `available_time`, `created_at`.
7. **`itinerary_destinations`**: `id`, `itinerary_id` (FK -> `itineraries.id`), `destination_id` (FK -> `destinations.id`), `visit_order`.

---

## 🧮 A* Pathfinding Algorithm Implementation

Located in `backend/app/algorithms/astar.py`.

The A\* algorithm determines the shortest driving/walking path between any two geographical points over a connected graph of Maharashtra road junctions:

$$\begin{aligned}
f(n) &= g(n) + h(n)
\end{aligned}$$

- **$g(n)$**: The exact accumulated road distance from the start intersection to node $n$.
- **$h(n)$**: The admissible and consistent **Haversine Distance** heuristic from node $n$ to the destination:

$$\begin{aligned}
a &= \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right) \\
c &= 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right) \\
d &= R \cdot c \quad (R = 6371.0088\text{ km})
\end{aligned}$$

- **Snap-to-Road-Graph**: Input GPS coordinates are dynamically snapped to the nearest road network node before traversing graph edges.
- **Result**: Returns ordered waypoint coordinates `[[lat, lng], ...]`, total kilometers, step counts, and estimated duration rendered as an illuminated polyline in Leaflet.

---

## 👁️ YOLO Landmark Detection Pipeline

Located in `backend/app/ai/yolo_detector.py` and `backend/train_yolo.py`.

### 1. Training Custom Weights
To train a custom lightweight YOLOv8n (nano) model on Indian monuments:
```bash
cd backend
python train_yolo.py --data ./data/landmarks/data.yaml --epochs 50 --batch 16
```

### 2. Dataset Format (`data/landmarks/data.yaml`):
```yaml
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
```

### 3. Inference & Visual Verification Fallback
When custom `.pt` weights are loaded in `models/best.pt`, the backend runs native YOLO inference with confidence scoring. If custom weights are not yet trained, the system operates in **Demonstration Verification Mode** using OpenCV edge-density analysis, color warmth profiling, and visual signature matching without faking recognition.

---

## 🤖 Groq AI Recommender & Grounding

Located in `backend/app/ai/groq_service.py`.

- **Strict Source of Truth**: Candidate destinations are retrieved from MySQL matching the user's budget and region.
- **LLaMA-3.3 70B Versatile Integration**: Formulates structured itineraries arranging stops in logical sequence (e.g. morning, afternoon, evening slots).
- **Anti-Hallucination Guardrails**: Groq is strictly constrained to the supplied catalog IDs and verified prices.
- **Offline / Failure Fallback**: If `GROQ_API_KEY` is not provided or network fails, a deterministic scoring algorithm ranks destinations based on interest vectors and budgetary viability.

---

## 🧭 Camera AR Direction HUD

Located in `frontend/components/CameraAROverlay.tsx`.

- **Camera Preview**: Utilizes WebRTC `navigator.mediaDevices.getUserMedia` with `facingMode: "environment"` (rear camera on mobile devices).
- **Azimuth Bearing Calculation**:

$$\begin{aligned}
y &= \sin(\Delta \lambda) \cdot \cos(\phi_2) \\
x &= \cos(\phi_1)\sin(\phi_2) - \sin(\phi_1)\cos(\phi_2)\cos(\Delta \lambda) \\
\theta &= \text{atan2}(y, x) \pmod{360^\circ}
\end{aligned}$$

- **Direction Reticle**: Rotates in real time relative to the device compass heading (`DeviceOrientationEvent`).
- **Hardware Fallback**: Full directional radar & bearing indicator rendered when camera permissions are unavailable.

---

## 🚀 Step-by-Step Setup Instructions for Windows

### Prerequisites
- **Node.js** (v18.x or v20.x+)
- **Python** (v3.10 to v3.14)
- **MySQL Server 8.0** (or XAMPP)

---

### Step 1: Clone or Navigate to Project Directory
```powershell
cd d:\yatraai
```

---

### Step 2: Configure Environment Variables
Create `.env` inside `backend/`:
```powershell
cp .env.example backend/.env
```

Edit `backend/.env` with your settings:
```ini
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/yatraai
GROQ_API_KEY=your_groq_api_key_here
GEOAPIFY_API_KEY=your_geoapify_api_key_here
SECRET_KEY=yatraai_dev_secret_key_change_in_production_2026
YOLO_MODEL_PATH=./models/best.pt
ENVIRONMENT=development
```
> **Note on Database Connection**: If MySQL is not running or not yet configured on your machine, YatraAI automatically connects to a local fallback database (`yatraai.db`), ensuring zero downtime during college demonstrations!

---

### Step 3: Setup & Seed Backend
Open a PowerShell terminal:
```powershell
cd d:\yatraai\backend

# Install python dependencies
python -m pip install -r requirements.txt

# Run database setup & seed script
python seed.py
```

Expected output:
```
[1/4] Ensuring database tables exist...
[2/4] Seeding Admin Account...
  -> Created Admin Account: username='admin', password='admin' (Dev Only)
  -> Created Demo User: 'rohit@yatraai.demo' / 'password123'
[3/4] Seeding Maharashtra Regions and Districts...
[4/4] Seeding Maharashtra Heritage & Tourist Destinations...
  -> Added destination: 'Shaniwar Wada' (Forts)
  -> Added destination: 'Aga Khan Palace' (Heritage)
  ...
Database Seeding Completed Successfully! All records verified.
```

---

### Step 4: Run Backend Tests
Verify all 9 backend test suites pass:
```powershell
python -m pytest tests/ -v
```

---

### Step 5: Start Backend Server
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Root: `http://127.0.0.1:8000/`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

---

### Step 6: Setup & Start Frontend
Open a second PowerShell terminal:
```powershell
cd d:\yatraai\frontend

# Install dependencies
npm install

# Run production build check
npm run build

# Start Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Default Credentials (College Demonstration Only)

| Role | Username / Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin` (or `admin@yatraai.local`) | `admin` | Full Admin Dashboard, Destination CRUD, Region & District management, User activation/deactivation, Photo management |
| **Demo Traveler** | `rohit@yatraai.demo` | `password123` | Trip planning, Itinerary saving, Favourites management, AR Navigation, Camera scanner |

> ⚠️ **Important**: These seeded credentials are intended for local demonstration purposes only. Passwords are encrypted using high-cost bcrypt hashes.

---

## 🧪 Comprehensive Test Results

All unit and integration test suites executed successfully:

| Test Case | Module | Status | Verification Detail |
|---|---|---|---|
| `test_root` | System Core | ✅ PASSED | Confirms FastAPI operational status & version |
| `test_health` | System Core | ✅ PASSED | Validates AI service configuration |
| `test_get_public_destinations` | Destinations | ✅ PASSED | Confirms public access without authentication |
| `test_destination_details` | Destinations | ✅ PASSED | Confirms verified history, architecture & geo specs |
| `test_admin_login` | Security & Auth | ✅ PASSED | Verifies bcrypt password verification & JWT claims |
| `test_user_registration_and_login`| Security & Auth | ✅ PASSED | Confirms email validation & user registration flow |
| `test_astar_routing_algorithm` | Graph Algorithms| ✅ PASSED | Verifies shortest road path over Pune-Sinhagad graph |
| `test_recommendation_pipeline` | AIML Recommender| ✅ PASSED | Validates budget/time-constrained itinerary generation |
| `test_offline_pack` | Offline Engine | ✅ PASSED | Confirms IndexedDB regional bundle packaging |

---

## 📌 Known Limitations & Future Improvements

1. **Spatial 6DoF AR**: Current AR navigation runs inside mobile web browsers via device compass orientation and Great-Circle azimuth vectors. Full 6-Degree-of-Freedom spatial tracking with surface anchoring would require native Android/iOS integration via ARCore or WebXR.
2. **Dynamic Live Traffic**: The A\* algorithm calculates static road segment weights from distance. Integrating real-time transit congestion feeds (e.g. TomTom / Google Traffic APIs) can provide dynamic impedance updates.
3. **Multi-Lingual Audio Narration**: Groq-generated cultural insights can be coupled with Marathi text-to-speech (TTS) engines for localized audio tours at monument entrances.

---

## 🎓 Academic Demonstration Checklist

- [x] **Public Homepage**: Dark navy tech theme with 4 prominent action triggers.
- [x] **Destination Modal**: Real verified photos, attribution, and "2D Map" + "AR Navigation" buttons.
- [x] **RBAC Authentication**: Admin (`admin`/`admin`) vs Traveler accounts.
- [x] **A\* Routing Module**: Real road graph with Haversine heuristic (not an external black-box API).
- [x] **YOLO Landmark Scanner**: Image upload & camera capture with confidence scoring.
- [x] **Groq AI Recommender**: Strict MySQL database grounding preventing hallucination.
- [x] **IndexedDB Offline Mode**: Field data storage compliant with tile usage rules.
- [x] **Admin Management Portal**: Destinations, Regions, Users, and Photo upload management.

