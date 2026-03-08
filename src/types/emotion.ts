export type EmotionState = 'flow' | 'focused' | 'confused' | 'bored' | 'fatigued' | 'neutral';

export interface EmotionReading {
  state: EmotionState;
  confidence: number;
  timestamp: number;
}

export interface MultiModalSignals {
  typingVariance: number;
  mouseIdlePercent: number;
  scrollRevisits: number;
  isTyping: boolean;
}

export interface SessionEvent {
  timestamp: number;
  state: EmotionState;
  confidence: number;
  topic: string;
}

export interface SessionStats {
  totalMinutes: number;
  flowMinutes: number;
  longestFlowStreak: number;
  confusionClusters: number;
  topEmotion: EmotionState;
}

export const EMOTION_CONFIG: Record<EmotionState, { label: string; emoji: string; colorClass: string; gradientClass: string }> = {
  flow: { label: 'Flow State', emoji: '🔥', colorClass: 'text-emotion-flow', gradientClass: 'emotion-gradient-flow' },
  focused: { label: 'Focused', emoji: '🎯', colorClass: 'text-emotion-focused', gradientClass: 'emotion-gradient-focused' },
  confused: { label: 'Confused', emoji: '😕', colorClass: 'text-emotion-confused', gradientClass: 'emotion-gradient-confused' },
  bored: { label: 'Bored', emoji: '😴', colorClass: 'text-emotion-bored', gradientClass: 'emotion-gradient-bored' },
  fatigued: { label: 'Fatigued', emoji: '😩', colorClass: 'text-emotion-fatigued', gradientClass: 'emotion-gradient-fatigued' },
  neutral: { label: 'Neutral', emoji: '😐', colorClass: 'text-emotion-neutral', gradientClass: 'emotion-gradient-neutral' },
};
