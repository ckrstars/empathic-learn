# 🧠 EmotiLearn — Emotion-Aware Adaptive Learning Platform

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/react-18.3-61dafb.svg" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-5.8-3178c6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/vite-5.4-646cff.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/tailwindcss-3.4-06b6d4.svg" alt="Tailwind CSS" />
</p>

<p align="center">
  <strong>An intelligent learning companion that reads your emotions in real-time and adapts content delivery to maximize focus, retention, and well-being.</strong>
</p>

---

## 🌟 Overview

EmotiLearn uses **real-time facial expression analysis** combined with **behavioral signals** (typing patterns, mouse movement, scroll behavior) to understand your emotional and cognitive state while learning. It then adapts the learning experience — adjusting pacing, suggesting breaks, and modulating content — to keep you in an optimal learning flow.

### Why EmotiLearn?

Traditional e-learning platforms deliver the same content at the same pace regardless of whether you're deeply focused, confused, bored, or fatigued. EmotiLearn bridges this gap by:

- **Detecting** your emotional state through webcam-based facial expression recognition
- **Fusing** multiple behavioral signals for robust emotion estimation
- **Adapting** content delivery in real-time based on your state
- **Tracking** your learning journey with rich emotion timelines and session analytics

---

## ✨ Features

### 🎭 Real-Time Emotion Detection
- Webcam-based facial expression analysis using **TinyFaceDetector** + **FaceExpressionNet** (via `@vladmandic/face-api`)
- Maps 7 raw expressions → 5 learning states: **Flow**, **Focused**, **Confused**, **Bored**, **Fatigued**
- Live emotion confidence display with color-coded indicators

### 🔀 Multi-Modal Signal Fusion
- **Webcam** (50%): Facial expressions and micro-expressions
- **Typing patterns** (20%): Speed, rhythm, pause frequency
- **Mouse behavior** (20%): Movement velocity, click patterns, idle time
- **Scroll patterns** (10%): Speed, direction changes, engagement depth
- Weighted fusion algorithm produces a robust composite emotion state

### 📊 Learning Journey Visualization
- Real-time emotion timeline using **Recharts**
- Session statistics: total time, flow minutes, confusion clusters, longest flow streak
- Historical session review with detailed event logs

### 🧘 Wellness Integration
- **Breathing break** overlays triggered during detected fatigue or stress
- **Flow state** celebration overlays when sustained focus is detected
- Adaptive break suggestions based on session duration and emotional patterns

### 📄 Document Management
- Upload and manage **PDFs** and **images** for learning materials
- **Fullscreen document viewer** with zoom controls (50%–300%)
- Client-side PDF rendering via `pdfjs-dist` (no server-side processing)
- Per-user file storage with secure access controls

### 🤖 Adaptive Content
- AI-powered content adaptation based on current emotional state
- Dynamic pacing adjustments (slow down when confused, speed up when bored)
- Contextual encouragement and feedback

### 🔐 Authentication & Data Persistence
- Secure user authentication (email/password)
- Per-user session history and document storage
- Profile management with avatar support

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript | UI framework with type safety |
| **Build** | Vite 5 | Fast dev server & optimized builds |
| **Styling** | Tailwind CSS, shadcn/ui | Utility-first CSS with accessible components |
| **ML/Vision** | @vladmandic/face-api | Facial expression recognition |
| **PDF** | pdfjs-dist | Client-side PDF rendering |
| **Charts** | Recharts | Data visualization |
| **Animation** | Framer Motion | Smooth UI transitions |
| **Backend** | Supabase | Auth, PostgreSQL database, file storage |
| **Routing** | React Router v6 | Client-side navigation |
| **State** | TanStack Query | Server state management |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- A **webcam** for emotion detection features
- A **Supabase** project for backend services

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/emotilearn.git
cd emotilearn

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the development server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anonymous/public key |

### Database Setup

The project includes Supabase migrations in `supabase/migrations/`. Apply them to your Supabase project:

```bash
# Using Supabase CLI
supabase db push
```

This creates the required tables:
- `profiles` — User profile data
- `session_history` — Learning session logs with emotion events
- `user_documents` — Uploaded file metadata

And a storage bucket:
- `assignments` — Secure per-user file storage

---

## 🏗️ Architecture

### Emotion Detection Pipeline

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Webcam Feed │────▶│  TinyFaceDetector │────▶│ FaceExpressionNet│
└─────────────┘     └──────────────────┘     └───────┬────────┘
                                                      │
                    Raw Expressions (7 classes)        │
                    ┌─────────────────────────────────┘
                    ▼
            ┌───────────────┐
            │ useWebcamEmotion │──── Maps to 5 learning states
            └───────┬───────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌────────┐   ┌──────────┐   ┌──────────┐
│ Typing │   │  Mouse   │   │  Scroll  │
│ Signals│   │ Signals  │   │ Signals  │
└───┬────┘   └────┬─────┘   └────┬─────┘
    └──────────┬──┘──────────────┘
               ▼
      ┌─────────────────┐
      │ useEmotionFusion │──── Weighted composite (50/20/20/10)
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │  Adaptive UI     │──── Pacing, breaks, content, tone
      └─────────────────┘
```

### Component Hierarchy

```
App
├── Auth (login/signup)
├── Index (landing)
├── LearningDashboard (main experience)
│   ├── WebcamWidget (camera feed + emotion overlay)
│   ├── EmotionStateBar (current state display)
│   ├── LessonPlayer (content delivery)
│   ├── AdaptiveResponse (AI-driven adaptation)
│   ├── JourneyMap (emotion timeline chart)
│   ├── SignalsPanel (debug: raw signal values)
│   ├── SessionStatsCard (metrics)
│   ├── DocumentUploader (file management)
│   ├── DocumentViewer (fullscreen reader)
│   ├── BreathingBreak (wellness overlay)
│   └── FlowStateOverlay (flow celebration)
└── History (past sessions)
```

---

## 🎨 Design System

EmotiLearn uses a custom dark theme with glassmorphism aesthetics:

| Token | Value | Usage |
|---|---|---|
| **Background** | `hsl(230, 25%, 7%)` | Main background |
| **Primary** | `hsl(185, 80%, 48%)` | Cyan accent, CTAs |
| **Flow** | Purple | Flow state indicators |
| **Focused** | Green | Focused state indicators |
| **Confused** | Orange | Confusion indicators |
| **Bored** | Yellow | Boredom indicators |
| **Fatigued** | Red | Fatigue indicators |

**Fonts:** Space Grotesk (headings/body), JetBrains Mono (data/code)

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npx vitest --watch
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up your development environment
- Project architecture and coding standards
- Pull request process
- Bug reporting and feature requests

---

## 📋 Roadmap

- [ ] **Gaze tracking** — Eye position analysis for attention mapping
- [ ] **Blink rate detection** — Advanced fatigue detection via face landmarks
- [ ] **AI document analysis** — Auto-generate quizzes from uploaded PDFs
- [ ] **Voice modulation** — Adaptive narration tone based on emotion
- [ ] **Export journey maps** — Download session timelines as PNG/PDF
- [ ] **Collaborative learning** — Real-time shared sessions
- [ ] **Mobile support** — Responsive design with mobile camera support
- [ ] **Accessibility** — Full WCAG 2.1 AA compliance
- [ ] **i18n** — Multi-language support

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [face-api.js](https://github.com/vladmandic/face-api) — Facial expression recognition
- [shadcn/ui](https://ui.shadcn.com/) — Accessible UI components
- [Supabase](https://supabase.com/) — Backend infrastructure
- [Recharts](https://recharts.org/) — Charting library
- [Framer Motion](https://www.framer.com/motion/) — Animation library

---

<p align="center">
  Built with ❤️ and 🧠 by the EmotiLearn community
</p>
