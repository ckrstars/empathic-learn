import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  const endSession = useCallback(async () => {
    setIsSessionActive(false);
    const stats = computeStats(events, startTimeRef.current);

    // Save to database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('session_history').insert({
        user_id: user.id,
        started_at: new Date(startTimeRef.current).toISOString(),
        ended_at: new Date().toISOString(),
        total_minutes: stats.totalMinutes,
        flow_minutes: stats.flowMinutes,
        longest_flow_streak: stats.longestFlowStreak,
        confusion_clusters: stats.confusionClusters,
        top_emotion: stats.topEmotion,
        events: events as any,
      } as any);
    }
  }, [events]);

  const getStats = useCallback((): SessionStats => {
    return computeStats(events, startTimeRef.current);
  }, [events]);

  return { events, isSessionActive, startSession, endSession, logState, getStats };
}

function computeStats(events: SessionEvent[], startTime: number): SessionStats {
  if (events.length === 0) {
    return { totalMinutes: 0, flowMinutes: 0, longestFlowStreak: 0, confusionClusters: 0, topEmotion: 'neutral' };
  }

  const totalMs = Date.now() - startTime;
  const totalMinutes = Math.round(totalMs / 60000 * 10) / 10;

  const stateDurations: Record<EmotionState, number> = {
    flow: 0, focused: 0, confused: 0, bored: 0, fatigued: 0, neutral: 0,
  };

  for (let i = 0; i < events.length; i++) {
    const nextTime = i < events.length - 1 ? events[i + 1].timestamp : Date.now();
    const duration = nextTime - events[i].timestamp;
    stateDurations[events[i].state] += duration;
  }

  const flowMinutes = Math.round(stateDurations.flow / 60000 * 10) / 10;

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

  let topEmotion: EmotionState = 'neutral';
  let maxDuration = 0;
  for (const [state, duration] of Object.entries(stateDurations)) {
    if (duration > maxDuration) {
      maxDuration = duration;
      topEmotion = state as EmotionState;
    }
  }

  return { totalMinutes, flowMinutes, longestFlowStreak, confusionClusters, topEmotion };
}
