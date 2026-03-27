# Contributing to EmotiLearn

Thank you for your interest in contributing to EmotiLearn! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful, inclusive, and harassment-free environment for everyone. Be kind, constructive, and professional in all interactions.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/emotilearn.git
   cd emotilearn
   ```
3. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- **Node.js** v18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** or **bun** package manager
- A modern browser with webcam access (for emotion detection testing)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

> **Note:** You'll need a Supabase project for backend features (auth, storage, database). See [Supabase docs](https://supabase.com/docs) for setup instructions.

### Running Tests

```bash
npm run test
```

## Project Architecture

```
src/
├── components/           # React components
│   ├── ui/              # Reusable shadcn/ui primitives
│   ├── AdaptiveResponse.tsx    # AI-driven adaptive content
│   ├── BreathingBreak.tsx      # Wellness break overlay
│   ├── DocumentUploader.tsx    # File upload & management
│   ├── DocumentViewer.tsx      # Fullscreen PDF/image viewer
│   ├── EmotionStateBar.tsx     # Real-time emotion display
│   ├── FlowStateOverlay.tsx    # Flow state visual feedback
│   ├── JourneyMap.tsx          # Session emotion timeline
│   ├── LearningDashboard.tsx   # Main dashboard layout
│   ├── LessonPlayer.tsx        # Content delivery component
│   ├── SessionStatsCard.tsx    # Session metrics display
│   ├── SignalsPanel.tsx        # Multi-modal signal debug view
│   └── WebcamWidget.tsx        # Webcam feed & emotion overlay
├── hooks/               # Custom React hooks
│   ├── useAuth.ts             # Authentication state
│   ├── useEmotionFusion.ts    # Multi-modal emotion fusion
│   ├── useMultiModalSignals.ts # Keyboard/mouse/scroll signals
│   ├── useSessionLogger.ts    # Session event logging
│   └── useWebcamEmotion.ts    # face-api.js webcam analysis
├── pages/               # Route pages
│   ├── Auth.tsx               # Login/signup
│   ├── History.tsx            # Session history
│   ├── Index.tsx              # Landing/home
│   └── ResetPassword.tsx      # Password reset
├── types/               # TypeScript type definitions
│   └── emotion.ts             # Emotion & signal types
├── integrations/        # External service clients
│   └── supabase/              # Auto-generated Supabase client
├── index.css            # Global styles & design tokens
└── App.tsx              # Root component & routing
```

### Key Technologies

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **@vladmandic/face-api** | Facial expression recognition (TinyFaceDetector + FaceExpressionNet) |
| **pdfjs-dist** | Client-side PDF rendering |
| **Recharts** | Data visualization |
| **Framer Motion** | Animations |
| **Supabase** | Auth, database, file storage |

### Emotion Detection Pipeline

```
Webcam Feed → face-api.js (TinyFaceDetector + FaceExpressionNet)
                    ↓
              Raw Expressions (happy, sad, angry, surprised, neutral, fearful, disgusted)
                    ↓
              useWebcamEmotion → Maps to learning states (flow, focused, confused, bored, fatigued)
                    ↓
              useMultiModalSignals → Captures typing speed, mouse movement, scroll patterns
                    ↓
              useEmotionFusion → Weighted fusion (50% face + 20% typing + 20% mouse + 10% scroll)
                    ↓
              Final Emotion State → Drives adaptive UI (content pacing, break suggestions, tone)
```

## How to Contribute

### Areas Where Help Is Needed

- 🧠 **ML/AI**: Improve emotion classification accuracy, add gaze tracking, blink rate fatigue detection
- 📄 **Document Analysis**: AI-powered PDF summarization, quiz generation from uploaded documents
- 🎨 **UI/UX**: Accessibility improvements, responsive design refinements, new visualizations
- 🧪 **Testing**: Unit tests, integration tests, E2E tests
- 📝 **Documentation**: Tutorials, API docs, usage examples
- 🌐 **i18n**: Internationalization and localization support
- ♿ **Accessibility**: Screen reader support, keyboard navigation, WCAG compliance

### Types of Contributions

- **Bug fixes** — Find and fix issues
- **Features** — Implement new functionality
- **Documentation** — Improve docs, add examples
- **Tests** — Increase test coverage
- **Performance** — Optimize rendering, reduce bundle size
- **Design** — UI/UX improvements following the design system

## Pull Request Process

1. **Ensure your code follows** the [Coding Standards](#coding-standards) below
2. **Update documentation** if your change affects the public API or user-facing behavior
3. **Write tests** for new functionality when possible
4. **Keep PRs focused** — one feature or fix per PR
5. **Write a clear PR description** explaining:
   - What the change does
   - Why it's needed
   - How to test it
   - Screenshots/recordings for UI changes
6. **Request a review** from a maintainer
7. **Address review feedback** promptly

### PR Title Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add blink rate fatigue detection
fix: resolve PDF rendering on Safari
docs: update contributing guide
style: improve emotion bar responsiveness
refactor: extract signal processing into utils
test: add unit tests for emotion fusion hook
```

## Coding Standards

### General

- Write **TypeScript** for all new code — avoid `any` types
- Use **functional components** with hooks
- Follow **React best practices** (proper key props, memoization where needed)
- Keep components **small and focused** (< 200 lines ideally)

### Styling

- Use **Tailwind CSS** utility classes
- Reference **semantic design tokens** from `index.css` (e.g., `bg-primary`, `text-foreground`) — never hardcode colors
- Follow the existing **glassmorphism** aesthetic (`.glass` utility class)
- All colors must use **HSL** format in the design system

### File Naming

- Components: `PascalCase.tsx` (e.g., `EmotionStateBar.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useEmotionFusion.ts`)
- Types: `camelCase.ts` (e.g., `emotion.ts`)
- Pages: `PascalCase.tsx` (e.g., `History.tsx`)

### Commit Messages

- Use present tense ("add feature" not "added feature")
- Keep the first line under 72 characters
- Reference issues when applicable (`fixes #123`)

## Reporting Bugs

Open a [GitHub Issue](../../issues) with:

1. **Title**: Clear, concise description
2. **Environment**: Browser, OS, device type
3. **Steps to Reproduce**: Numbered steps to trigger the bug
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Screenshots/Logs**: Browser console output, screen recordings
7. **Webcam/Permission Info**: If related to emotion detection, note camera permissions and lighting conditions

## Suggesting Features

Open a [GitHub Issue](../../issues) with the **Feature Request** label:

1. **Problem**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives Considered**: Other approaches you thought about
4. **Additional Context**: Mockups, references, research

---

## Questions?

If you have questions about contributing, open a [Discussion](../../discussions) or reach out to the maintainers.

Thank you for helping make EmotiLearn better! 🧠✨
