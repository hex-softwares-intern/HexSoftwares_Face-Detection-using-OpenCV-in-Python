# 🛡️ HexSoftwares — Face Detection using OpenCV (Python).

![Internship](https://img.shields.io/badge/HexSoftwares-Internship-blue?style=flat-square) ![Domain](https://img.shields.io/badge/Domain-Artificial%20Intelligence-purple?style=flat-square) ![Task](https://img.shields.io/badge/Task-2%20%7C%20Project%202-orange?style=flat-square)

> **📌 Internship Track:** Artificial Intelligence · Task 2 · Project 2

> A professional full-stack AI suite for robust face detection in real-world conditions. This system combines a high-performance **Flask** backend using **MTCNN** with a modern **Next.js 15** frontend for real-time image and webcam-based analysis.

---

## 🔥 Problem Statement

In real-world computer vision environments, standard detection fails due to:

| Challenge | Description |
|---|---|
| 📐 Variable Resolutions | Images range from 1080p to low-res thumbnails |
| 👤 Face Proportions | Too small → Faces in crowds are missed · Too large → Close-ups get cropped |
| 🌀 Motion Blur | Movement or resizing reduces detection accuracy |
| 💡 Lighting Conditions | Dark / overexposed images hide facial features |

---

## ✅ The "Industry Standard" Solution

This project implements a production-grade pipeline:

### 1️⃣ Smart Input Normalization

Instead of naive resizing, we preserve aspect ratio using padding:

```python
def resize_with_padding(img, target_size=640):
    h, w = img.shape[:2]
    scale = target_size / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(img, (new_w, new_h))

    canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
    canvas[:new_h, :new_w] = resized
    return canvas
```

### 2️⃣ Image Pyramids (Multi-Scale Detection)

MTCNN scans images at multiple scales:

- ✅ Detects small faces in crowds
- ✅ Handles large close-up faces
- ✅ Improves robustness across resolutions

### 3️⃣ Neural Clarity Enhancement

We enhance image quality before detection:

| Technique | Effect |
|---|---|
| Sharpening Kernel | Improves edge definition |
| LAB Color Space Equalization | Enhances brightness (L channel) · Reveals faces in shadows |

### 4️⃣ Minimum Face Size Tuning

```python
min_face_size = 15  # Optimized for small face detection
```

> Works well in crowded environments.

---

## 🛠️ Technical Stack

| Component | Technology | Use Case |
|---|---|---|
| Backend | Python / Flask | REST API & image processing |
| CV Engine | OpenCV / MTCNN | Face detection & inference |
| Frontend | Next.js 15 / TypeScript | Dashboard & real-time analysis |
| Styling | Tailwind CSS / Shadcn UI | Clean UI/UX |

---

## 📂 Project Structure

```
HexSoftwares_Face-Detection/
├── backend/
│   ├── app.py              # Flask Server & Detection Logic
│   └── requirements.txt    # Dependencies (OpenCV, TensorFlow, MTCNN)
│
└── frontend/
    ├── app/                # Next.js 15 App Router
    ├── components/         # UI Components (Shadcn)
    └── public/             # Static Assets
```

---

## 🚀 Installation & Usage

### 🔹 1. Setup Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 🔹 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 🌐 Access the App

Open your browser at **http://localhost:3000**

---

## ⚖️ License

Copyright 2026 \[Your Name/Organization\]

Licensed under the **Apache License, Version 2.0**. You may not use this file except in compliance with the License.

You may obtain a copy of the License at:
🔗 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an **"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND**.

---

## 🎯 Acknowledgment

> Developed as part of the **HexSoftwares Internship Program** 🚀
