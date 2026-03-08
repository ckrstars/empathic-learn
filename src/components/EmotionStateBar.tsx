import { motion } from 'framer-motion';
import { EMOTION_CONFIG, type EmotionState } from '@/types/emotion';
import { Activity, Timer } from 'lucide-react';

interface EmotionStateBarProps {
  state: EmotionState;
  confidence: number;
  flowMinutes: number;
  sessionMinutes: number;
}

export function EmotionStateBar({ state, confidence, flowMinutes, sessionMinutes }: EmotionStateBarProps) {
  const config = EMOTION_CONFIG[state];

  return (
    <div className="glass rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-3 h-3 rounded-full ${config.gradientClass}`}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <span className={`font-semibold ${config.colorClass}`}>{config.label}</span>
          <span className="text-muted-foreground text-sm font-mono">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emotion-flow" />
          <span className="font-mono">{flowMinutes}m</span>
          <span className="hidden sm:inline">flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono">{sessionMinutes}m</span>
          <span className="hidden sm:inline">session</span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="hidden md:flex items-center gap-2 min-w-[120px]">
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${config.gradientClass}`}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
