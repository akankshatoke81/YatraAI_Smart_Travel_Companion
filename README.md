# YatraAI – Smart Travel Companion

YatraAI is an AI-powered tourism platform designed to make exploring Maharashtra easier and more informative. It uses **YOLO11n, Computer Vision, Python FastAPI, and Next.js** to identify famous tourist landmarks and monuments.

The platform recognizes 29 Maharashtra landmark classes, provides information about monuments and tourist attractions, and helps users navigate to their destinations.

## ✨ Key Features

- **AI-Based Landmark Detection:** Identifies Maharashtra's famous landmarks using a trained YOLO11n object detection model.
- **Monument Information:** Provides details about historical monuments, forts, temples, caves, beaches, and other tourist attractions.
- **Navigation:** Helps users navigate to tourist destinations.
- **29 Landmark Classes:** Supports recognition of 29 Maharashtra tourist landmarks.
- **Interactive Frontend:** Provides a user-friendly interface built with Next.js.
- **REST API:** Uses FastAPI for communication between the frontend and backend.
- **Model Training Pipeline:** Supports YOLO model training and evaluation.

## 🛠️ Technologies Used

### Frontend
- Next.js
- React.js
- TypeScript
- Tailwind CSS
- JavaScript

### Backend
- Python
- FastAPI
- Uvicorn
- SQLite
- SQLAlchemy (if configured in the application)

### AI / Machine Learning
- YOLO11n
- Ultralytics
- PyTorch
- OpenCV
- Computer Vision

## 📁 Project Structure

```text
YatraAI/
│
├── backend/
│   ├── app/                 # FastAPI application
│   ├── ml_pipeline/         # Machine learning pipeline
│   ├── models/              # Model files and model-related code
│   ├── tests/               # Backend testing files
│   ├── uploads/              # Uploaded images
│   ├── requirements.txt      # Python dependencies
│   ├── seed.py               # Database initialization
│   └── train_yolo.py         # YOLO model training script
│
├── data/                    # Dataset files (kept locally)
│
├── frontend/
│   ├── app/                  # Next.js pages and layouts
│   ├── components/           # Reusable UI components
│   ├── context/              # React context
│   ├── services/             # API integration
│   ├── utils/                # Utility functions
│   ├── package.json          # Node.js dependencies
│   ├── package-lock.json
│   ├── next.config.mjs
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── runs/                     # YOLO training outputs (not uploaded)
├── .env.example              # Example environment variables
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Prerequisites

Install the following before running the project:

- Python 3.10 or later (use a version compatible with the installed PyTorch and Ultralytics packages)
- Node.js and npm
- Git
- Visual Studio Code (recommended)

### 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YatraAI-Maharashtra-Tourism.git
```

Navigate into the project directory:

```bash
cd YatraAI-Maharashtra-Tourism
```

## 🐍 Backend Setup – FastAPI

### Step 1: Navigate to Backend

```bash
cd backend
```

### Step 2: Create a Virtual Environment

**Windows:**

```powershell
python -m venv venv
```

Activate it:

```powershell
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

Create a `.env` file in the backend directory.

Add the environment variables required by your application. For example:

```env
# Add the actual variable names required by your backend
```

Do not upload your actual `.env` file or API keys to GitHub.

### Step 5: Run the Backend Server

If the FastAPI application instance is named `app` inside `backend/app/main.py`, run:

```bash
uvicorn app.main:app --reload
```

The backend will be available at:

- API: http://127.0.0.1:8000
- Swagger Documentation: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

**Note:** If your FastAPI entry-point file is located elsewhere, update the Uvicorn module path accordingly.

## 🌐 Frontend Setup – Next.js

Open another terminal window.

### Step 1: Navigate to Frontend

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure API URL

If your frontend uses an environment variable for the backend URL, create a `.env.local` file.

Example:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Make sure the variable name matches the one used in your frontend source code.

### Step 4: Start the Frontend

```bash
npm run dev
```

The frontend will be available at:

http://localhost:3000

**Important:** Run the backend and frontend in separate terminals. Start the backend first.

## 🤖 YOLO11n Model Training

YatraAI uses YOLO11n for detecting and recognizing 29 Maharashtra tourism landmarks.

### Step 1: Prepare the Dataset

Organize your dataset in YOLO format:

```text
YatraAI_Dataset/
│
├── train/
│   ├── images/
│   └── labels/
│
├── valid/
│   ├── images/
│   └── labels/
│
├── test/
│   ├── images/
│   └── labels/
│
└── data.yaml
```

Each image must have a corresponding YOLO-format annotation file.

### Step 2: Configure data.yaml

Example:

```yaml
path: /path/to/YatraAI_Dataset

train: train/images
val: valid/images
test: test/images

nc: 29

names:
  - Raigad Fort
  - Shivneri Fort
  - Sinhagad Fort
  - Pratapgad Fort
  - Aga Khan Palace
  - Gateway of India
  - Ajanta Caves
  - Ellora Caves
  - Daulatabad Fort
  - Shaniwar Wada
  - Mahalaxmi Temple
  - Dagdusheth Halwai Ganpati Temple
  - Marine Drive
  - Elephanta Caves
  - Thoseghar Waterfall
  - Rankala Lake
  - Ganpatipule Beach
  - Tarkarli Beach
  - Trimbakeshwar Temple
  - Panhala Fort
  - Sindhudurg Fort
  - Vijaydurg Fort
  - Lohagad Fort
  - Torna Fort
  - Bibi Ka Maqbara
  - Bhimashankar Temple
  - Pandharpur Vitthal Temple
  - Grishneshwar Temple
  - Kanheri Caves
```

Update the dataset path according to your machine or training environment.

### Step 3: Install YOLO Dependencies

Make sure the required packages are installed:

```bash
pip install ultralytics torch torchvision opencv-python
```

### Step 4: Run the Training Script

From the backend directory:

```bash
python train_yolo.py
```

The training script should use the dataset configuration and training parameters defined in `train_yolo.py`.

For example, a YOLO11n training configuration can use:

```python
from ultralytics import YOLO

model = YOLO("yolo11n.pt")

model.train(
    data="path/to/data.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    name="yatraai_yolo11n"
)
```

Adjust the dataset path, batch size, and training parameters according to your available hardware.

### Step 5: Save the Trained Model

After training, Ultralytics generally saves the model weights inside:

```text
runs/detect/train/weights/
```

The best-performing weights are usually:

```text
best.pt
```

Copy the trained `best.pt` file into your configured model directory and update the backend model path if required.

**Note:** Training output paths depend on your Ultralytics configuration.

### Step 6: Evaluate the Model

Evaluate the trained model using the validation dataset and review:

- Precision
- Recall
- mAP@0.5
- mAP@0.5:0.95
- Confusion Matrix
- Training and validation loss

Use these metrics to understand model performance and identify areas for improvement.

## ▶️ Running the Complete Application

To run YatraAI locally, open two terminals.

**Terminal 1 – Backend**

```powershell
cd backend
python -m uvicorn app.main:app --port 8000 --reload
```

**Terminal 2 – Frontend**

```powershell
cd frontend
npm run dev
```

Open the application:

http://localhost:3000

Backend API documentation:

http://127.0.0.1:8000/docs

## 📌 Important Notes

- The dataset, trained model weights, environment files, database files, and generated training outputs may not be included in the GitHub repository.
- Download or configure the trained model weights before using landmark detection.
- Configure the frontend API URL and backend environment variables before running the application.
- Ensure that the dataset annotations follow YOLO format and that the class IDs match the 29 landmark classes.
- The actual model training process depends on the dataset and configuration available locally.

## 🚀 Future Enhancements

- Expand the landmark dataset with more images and variations.
- Improve landmark detection accuracy.
- Add more tourist destinations across Maharashtra.
- Enhance personalized tourism recommendations.
- Improve navigation and destination information.
- Deploy the platform for public access.

## 👩‍💻 Project

**YatraAI – AI-Powered Maharashtra Tourism Landmark Detection, Recognition, Information and Navigation Platform**

Developed using YOLO11n, Python FastAPI, and Next.js.

