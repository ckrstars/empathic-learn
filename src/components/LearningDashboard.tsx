import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, BarChart3, Brain, History, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { EmotionStateBar } from '@/components/EmotionStateBar';
import { WebcamWidget } from '@/components/WebcamWidget';
import { LessonPlayer } from '@/components/LessonPlayer';
import { FlowStateOverlay } from '@/components/FlowStateOverlay';
import { BreathingBreak } from '@/components/BreathingBreak';
import { JourneyMap } from '@/components/JourneyMap';
import { AdaptiveResponse } from '@/components/AdaptiveResponse';
import { SessionStatsCard } from '@/components/SessionStatsCard';
import { SignalsPanel } from '@/components/SignalsPanel';
import { useWebcamEmotion } from '@/hooks/useWebcamEmotion';
import { useMultiModalSignals } from '@/hooks/useMultiModalSignals';
import { useEmotionFusion } from '@/hooks/useEmotionFusion';
import { useSessionLogger } from '@/hooks/useSessionLogger';
import type { EmotionState } from '@/types/emotion';

export function LearningDashboard() {
  const { signOut } = useAuth();
  const [currentTopic, setCurrentTopic] = useState('What is Machine Learning?');
  const [showBreathing, setShowBreathing] = useState(false);
  const [showAdaptive, setShowAdaptive] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const fatigueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adaptiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const webcam = useWebcamEmotion();
  const signals = useMultiModalSignals();
  const session = useSessionLogger();

  const fusedEmotion = useEmotionFusion({
    webcamEmotion: webcam.isActive ? webcam.emotion : 'neutral',
    webcamConfidence: webcam.isActive ? webcam.confidence : 0.3,
    typingVariance: signals.typingVariance,
    mouseIdlePercent: signals.mouseIdlePercent,
    scrollRevisits: signals.scrollRevisits,
    isTyping: signals.isTyping,
  });

  const stats = session.getStats();
  const isInFlow = fusedEmotion.state === 'flow';

  // Session timer
  useEffect(() => {
    if (!session.isSessionActive) return;
    const interval = setInterval(() => setSessionTime(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [session.isSessionActive]);

  // Log emotion changes
  useEffect(() => {
    if (session.isSessionActive) {
      session.logState(fusedEmotion.state, fusedEmotion.confidence, currentTopic);
    }
  }, [fusedEmotion.state, session.isSessionActive, currentTopic]);

  // Fatigue trigger
  useEffect(() => {
    if (fusedEmotion.state === 'fatigued' && session.isSessionActive && !showBreathing) {
      if (fatigueTimerRef.current) clearTimeout(fatigueTimerRef.current);
      fatigueTimerRef.current = setTimeout(() => setShowBreathing(true), 8000);
    }
    return () => { if (fatigueTimerRef.current) clearTimeout(fatigueTimerRef.current); };
  }, [fusedEmotion.state, session.isSessionActive, showBreathing]);

  // Adaptive response trigger
  useEffect(() => {
    if ((fusedEmotion.state === 'confused' || fusedEmotion.state === 'bored') && session.isSessionActive && !showAdaptive) {
      if (adaptiveTimerRef.current) clearTimeout(adaptiveTimerRef.current);
      adaptiveTimerRef.current = setTimeout(() => setShowAdaptive(true), 6000);
    } else if (fusedEmotion.state !== 'confused' && fusedEmotion.state !== 'bored') {
      setShowAdaptive(false);
    }
    return () => { if (adaptiveTimerRef.current) clearTimeout(adaptiveTimerRef.current); };
  }, [fusedEmotion.state, session.isSessionActive, showAdaptive]);

  const handleStartSession = () => {
    session.startSession();
    setSessionTime(0);
    setShowJourney(false);
  };

  const handleEndSession = () => {
    session.endSession();
    webcam.stopDetection();
    setShowJourney(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <FlowStateOverlay isInFlow={isInFlow && session.isSessionActive} flowMinutes={stats.flowMinutes} />
      <BreathingBreak isVisible={showBreathing} onDismiss={() => setShowBreathing(false)} />

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">EmotiLearn</h1>
              <p className="text-xs text-muted-foreground">Emotion-Aware Learning System</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!session.isSessionActive ? (
              <Button onClick={handleStartSession} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Play className="w-4 h-4 mr-1.5" />
                Start Session
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowJourney(!showJourney)} className="border-border text-foreground">
                  <BarChart3 className="w-4 h-4 mr-1.5" />
                  Journey
                </Button>
                <Button variant="outline" onClick={handleEndSession} className="border-destructive text-destructive hover:bg-destructive/10">
                  <Square className="w-4 h-4 mr-1.5" />
                  End
                </Button>
              </>
            )}
          </div>
        </div>

        {session.isSessionActive && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <EmotionStateBar
              state={fusedEmotion.state}
              confidence={fusedEmotion.confidence}
              flowMinutes={stats.flowMinutes}
              sessionMinutes={sessionTime}
            />
          </motion.div>
        )}
      </header>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Main content */}
        <div className="space-y-4">
          <LessonPlayer onTopicChange={setCurrentTopic} />

          {showAdaptive && session.isSessionActive && (
            <AdaptiveResponse
              state={fusedEmotion.state}
              topic={currentTopic}
              onDismiss={() => setShowAdaptive(false)}
            />
          )}

          {showJourney && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <JourneyMap events={session.events} />
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <WebcamWidget
            onVideoReady={webcam.startDetection}
            onStop={webcam.stopDetection}
            isActive={webcam.isActive}
            isLoading={webcam.isLoading}
            error={webcam.error}
          />
          <SignalsPanel signals={signals} />
          <SessionStatsCard stats={stats} />
        </div>
      </div>

      {/* Landing state */}
      {!session.isSessionActive && session.events.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Learn Smarter?</h2>
            <p className="text-muted-foreground mb-6">
              EmotiLearn detects your emotional state using webcam, typing patterns, mouse movement,
              and scroll behavior to adapt your learning experience in real-time.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="glass rounded-lg p-3">
                <span className="text-2xl block mb-1">🎯</span>
                <strong className="text-foreground">Multi-Modal Fusion</strong>
                <p>4 signal sources combined</p>
              </div>
              <div className="glass rounded-lg p-3">
                <span className="text-2xl block mb-1">🔥</span>
                <strong className="text-foreground">Flow Detection</strong>
                <p>Protects your focus zone</p>
              </div>
              <div className="glass rounded-lg p-3">
                <span className="text-2xl block mb-1">🗺️</span>
                <strong className="text-foreground">Journey Map</strong>
                <p>Post-session insights</p>
              </div>
              <div className="glass rounded-lg p-3">
                <span className="text-2xl block mb-1">💡</span>
                <strong className="text-foreground">Adaptive Content</strong>
                <p>AI-powered responses</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
