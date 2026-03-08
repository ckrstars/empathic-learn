import { useMemo } from 'react';
import type { EmotionState, EmotionReading } from '@/types/emotion';

interface FusionInput {
  webcamEmotion: EmotionState;
  webcamConfidence: number;
  typingVariance: number;
  mouseIdlePercent: number;
  scrollRevisits: number;
  isTyping: boolean;
}

const emotionScores: Record<EmotionState, number> = {
  flow: 5, focused: 4, neutral: 3, bored: 2, confused: 1, fatigued: 0,
};

export function useEmotionFusion(input: FusionInput): EmotionReading {
  return useMemo(() => {
    const { webcamEmotion, webcamConfidence, typingVariance, mouseIdlePercent, scrollRevisits, isTyping } = input;

    // Multi-modal signal interpretation
    let typingState: EmotionState = 'neutral';
    if (isTyping && typingVariance < 0.2) typingState = 'focused';
    else if (isTyping && typingVariance > 0.6) typingState = 'confused';
    else if (!isTyping && mouseIdlePercent > 0.5) typingState = 'bored';

    let mouseState: EmotionState = 'neutral';
    if (mouseIdlePercent > 0.8) mouseState = 'fatigued';
    else if (mouseIdlePercent > 0.5) mouseState = 'bored';
    else if (mouseIdlePercent < 0.2) mouseState = 'focused';

    let scrollState: EmotionState = 'neutral';
    if (scrollRevisits > 5) scrollState = 'confused';
    else if (scrollRevisits > 2) scrollState = 'confused';

    // Weighted fusion
    const states = [
      { state: webcamEmotion, weight: 0.5 },
      { state: typingState, weight: 0.2 },
      { state: mouseState, weight: 0.2 },
      { state: scrollState, weight: 0.1 },
    ];

    // Score each possible state
    const stateScores: Record<EmotionState, number> = {
      flow: 0, focused: 0, neutral: 0, bored: 0, confused: 0, fatigued: 0,
    };

    for (const { state, weight } of states) {
      stateScores[state] += weight;
    }

    // Flow state detection: requires webcam focus + low typing variance + active engagement
    if (webcamEmotion === 'flow' || webcamEmotion === 'focused') {
      if (isTyping && typingVariance < 0.3 && mouseIdlePercent < 0.3) {
        stateScores.flow += 0.3;
      }
    }

    // Fatigue override: high mouse idle + confused webcam = fatigued
    if (mouseIdlePercent > 0.7 && (webcamEmotion === 'confused' || webcamEmotion === 'fatigued')) {
      stateScores.fatigued += 0.2;
    }

    // Find winner
    let bestState: EmotionState = 'neutral';
    let bestScore = 0;
    for (const [state, score] of Object.entries(stateScores) as [EmotionState, number][]) {
      if (score > bestScore) {
        bestScore = score;
        bestState = state;
      }
    }

    const confidence = Math.min(bestScore + webcamConfidence * 0.5, 1);

    return { state: bestState, confidence: Math.round(confidence * 100) / 100, timestamp: Date.now() };
  }, [input.webcamEmotion, input.webcamConfidence, input.typingVariance, input.mouseIdlePercent, input.scrollRevisits, input.isTyping]);
}
