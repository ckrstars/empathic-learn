import { useState, useCallback, useRef } from 'react';
import type { EmotionState, SessionEvent, SessionStats } from '@/types/emotion';

export function useSessionLogger() {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const startTimeRef = useRef<number>(0);
  const lastStateRef = useRef<EmotionState>('neutral');

  const startSession = useCallback(() => {
    setEvents([]);
    startTimeRef.current = Date.now();
    lastStateRef.current = 'neutral';
    setIsSessionActive(true);
  }, []);

  const logState = useCallback((state: EmotionState, confidence: number, topic: string) => {
    if (state !== lastStateRef.current) {
      lastStateRef.current = state;
      setEvents(prev => [...prev, { timestamp: Date.now(), state, confidence, topic }]);
    }
  }, []);

  const endSession = useCallback(() => {
    setIsSessionActive(false);
  }, []);

  const getStats = useCallback((): SessionStats => {
    if (events.length === 0) {
      return { totalMinutes: 0, flowMinutes: 0, longestFlowStreak: 0, confusionClusters: 0, topEmotion: 'neutral' };
    }

    const totalMs = Date.now() - startTimeRef.current;
    const totalMinutes = Math.round(totalMs / 60000 * 10) / 10;

    // Calculate time in each state
    const stateDurations: Record<EmotionState, number> = {
      flow: 0, focused: 0, confused: 0, bored: 0, fatigued: 0, neutral: 0,
    };

    for (let i = 0; i < events.length; i++) {
      const nextTime = i < events.length - 1 ? events[i + 1].timestamp : Date.now();
      const duration = nextTime - events[i].timestamp;
      stateDurations[events[i].state] += duration;
    }

    const flowMinutes = Math.round(stateDurations.flow / 60000 * 10) / 10;

    // Longest flow streak
    let longestFlowStreak = 0;
    let currentFlowStreak = 0;
    for (const event of events) {
      if (event.state === 'flow') {
        currentFlowStreak++;
        longestFlowStreak = Math.max(longestFlowStreak, currentFlowStreak);
      } else {
        currentFlowStreak = 0;
      }
    }

    // Confusion clusters
    let confusionClusters = 0;
    let inConfusion = false;
    for (const event of events) {
      if (event.state === 'confused' && !inConfusion) {
        confusionClusters++;
        inConfusion = true;
      } else if (event.state !== 'confused') {
        inConfusion = false;
      }
    }

    // Top emotion
    let topEmotion: EmotionState = 'neutral';
    let maxDuration = 0;
    for (const [state, duration] of Object.entries(stateDurations)) {
      if (duration > maxDuration) {
        maxDuration = duration;
        topEmotion = state as EmotionState;
      }
    }

    return { totalMinutes, flowMinutes, longestFlowStreak, confusionClusters, topEmotion };
  }, [events]);

  return { events, isSessionActive, startSession, endSession, logState, getStats };
}
