import { motion } from 'framer-motion';
import { Eye, Brain, MousePointer, Keyboard } from 'lucide-react';
import type { EmotionState } from '@/types/emotion';

interface EngagementScoreProps {
  emotionState: EmotionState;
  emotionConfidence: number;
  gazeScore: number;       // 0-1, how centered gaze is
  headPoseScore: number;   // 0-1, how straight head is
  typingVariance: number;
  mouseIdlePercent: number;
  isActive: boolean;
}

const emotionEngagement: Record<EmotionState, number> = {
  flow: 1.0, focused: 0.85, neutral: 0.5, bored: 0.25, confused: 0.35, fatigued: 0.15,
};

export function EngagementScore({
  emotionState, emotionConfidence, gazeScore, headPoseScore,
  typingVariance, mouseIdlePercent, isActive,
}: EngagementScoreProps) {
  if (!isActive) return null;

  // Weighted engagement formula
  const emotionScore = emotionEngagement[emotionState] * emotionConfidence;
  const typingScore = Math.max(0, 1 - typingVariance);
  const mouseScore = Math.max(0, 1 - mouseIdlePercent);

  const score = Math.round(
    (emotionScore * 0.3 + gazeScore * 0.25 + headPoseScore * 0.15 + typingScore * 0.15 + mouseScore * 0.15) * 100
  );

  const clampedScore = Math.min(100, Math.max(0, score));

  const getColor = (s: number) => {
    if (s >= 75) return 'text-emotion-focused';
    if (s >= 50) return 'text-primary';
    if (s >= 30) return 'text-emotion-confused';
    return 'text-emotion-fatigued';
  };

  const getGradient = (s: number) => {
    if (s >= 75) return 'emotion-gradient-focused';
    if (s >= 50) return 'emotion-gradient-flow';
    if (s >= 30) return 'emotion-gradient-confused';
    return 'emotion-gradient-fatigued';
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">🎯</span>
        Focus Score
      </h3>

      <div className="flex items-center gap-4">
        {/* Circular gauge */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" className="stroke-secondary" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r={radius} fill="none"
              className={`${getColor(clampedScore).replace('text-', 'stroke-')}`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold font-mono ${getColor(clampedScore)}`}>
              {clampedScore}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-1.5">
          <ScoreRow icon={<Brain className="w-3 h-3" />} label="Emotion" value={Math.round(emotionScore * 100)} />
          <ScoreRow icon={<Eye className="w-3 h-3" />} label="Gaze" value={Math.round(gazeScore * 100)} />
          <ScoreRow icon={<Keyboard className="w-3 h-3" />} label="Typing" value={Math.round(typingScore * 100)} />
          <ScoreRow icon={<MousePointer className="w-3 h-3" />} label="Mouse" value={Math.round(mouseScore * 100)} />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground w-12">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${value >= 70 ? 'bg-emotion-focused' : value >= 40 ? 'bg-primary' : 'bg-emotion-confused'}`}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{value}%</span>
    </div>
  );
}
