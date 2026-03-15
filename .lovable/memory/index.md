EmotiLearn - Memory Index

## Design System
- Dark theme: navy/charcoal bg (230 25% 7%), cyan primary (185 80% 48%)
- Fonts: Space Grotesk (headings/body), JetBrains Mono (code/data)
- Emotion colors: flow=purple, focused=green, confused=orange, bored=yellow, fatigued=red
- Glassmorphism cards with blur + subtle borders
- Custom CSS utilities: .glass, .glow-primary, .emotion-gradient-*

## Architecture
- Hooks: useWebcamEmotion (face-api.js + gaze + head pose), useMultiModalSignals, useEmotionFusion, useSessionLogger, useGazeTracking
- Multi-modal fusion: 50% webcam + 20% typing + 20% mouse + 10% scroll
- Engagement Score: 30% emotion + 25% gaze + 15% head pose + 15% typing + 15% mouse
- face-api.js via @vladmandic/face-api, models loaded from CDN
- Recharts for journey map timeline
- Edge functions: adaptive-content (quiz/explain), ai-tutor (streaming chat)
- Lovable AI: google/gemini-3-flash-preview, LOVABLE_API_KEY auto-provisioned

## Pages
- / : LearningDashboard (main)
- /teacher : Teacher Dashboard (attention heatmap, confusion alerts, topic difficulty)
- /history : Session history
- /auth : Login/signup

## Key Components
- EngagementScore: circular gauge with breakdown bars
- AITeachingAssistant: floating chat FAB, auto-triggers on confusion, streams via SSE
- DocumentViewer: lazy-loads PDF pages via IntersectionObserver
- DocumentUploader: files saved to user_documents table + assignments bucket
