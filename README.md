# GaitSense AI

AI-powered gait analysis that runs entirely in your browser. Walk in front of your camera in four directions and get a detailed biomechanical report — no app install, no backend, no data uploaded anywhere.

---

## How It Works

GaitSense uses **MediaPipe PoseLandmarker** to detect 33 body landmarks in real time from your webcam feed. It tracks how your hips, knees, ankles, heels, and toes move across four walking passes, then computes a set of clinical-style gait metrics from that data.

All processing happens on-device using WebGL/GPU acceleration. Nothing leaves your browser.

### The Analysis Pipeline

1. **Webcam feed** is processed frame-by-frame through MediaPipe
2. **33 3D landmarks** are extracted per frame (x, y, z + visibility confidence)
3. Landmarks are **smoothed** using a 5-frame moving average
4. **Step events** (heel-strike, toe-off) are detected from ankle/heel motion
5. **Metrics** are computed from step events across all four passes
6. A **GaitReport** with a score and recommendations is generated

---

## How to Use It

### What You Need
- A device with a camera (phone, laptop, or tablet)
- A browser with camera access (Chrome recommended)
- A clear space of at least 4–5 metres to walk in a straight line
- Someone to hold the camera, or a stable surface to prop it on at hip height

### Step-by-Step

**1. Grant camera access**
The app will ask for permission to use your camera. Allow it — nothing is recorded or stored.

**2. Read the protocol**
A quick explainer walks you through the four passes before you start.

**3. Walk four passes**

Place the camera sideways to your walking path, at roughly hip height.

| Pass | What to do |
|---|---|
| Front | Walk directly toward the camera |
| Rear | Walk directly away from the camera |
| Left side | Walk left-to-right across the camera's view |
| Right side | Walk right-to-left across the camera's view |

Each pass needs at least **3 strides** to be rated Good. The app detects your direction automatically and shows a live indicator for each pass. Recording stops automatically once all four are complete (max 90 seconds).

**4. Review your report**

After recording you get:
- **Overall gait score** (0–100)
- **Cadence** — steps per minute
- **Symmetry score** — left/right balance
- **Arch type** — flat / neutral / high (per foot)
- **Strike pattern** — heel / midfoot / forefoot
- **Toe angle** — toe-in or toe-out in degrees
- **Pathological pattern flags** — hip drop, heel whip, scissor gait, overpronation, leg length discrepancy
- **Recommendations** — footwear, strengthening, stretching, and when to see a professional

---

## Tips for Best Results

- Walk at your **natural, relaxed pace** — don't try to walk "correctly"
- Keep your **whole body in frame** — head to toe if possible
- Use **good lighting** — avoid strong backlighting
- Wear **form-fitting clothing** on your lower body for better landmark detection
- Walk on a **flat, even surface**

---

## Disclaimer

GaitSense AI is for **informational purposes only**. It is not a medical device and does not provide clinical diagnoses. If you have concerns about your gait or musculoskeletal health, consult a qualified healthcare professional.

---

## Running Locally

```bash
cd gait-analyzer
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Camera access requires `localhost` or HTTPS.

## Tech Stack

| | |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Pose Detection | MediaPipe Tasks Vision |
| Charts | Recharts |
