import { EMOTION_CONFIG, type EmotionState, type SessionStats } from '@/types/emotion';
import { Activity, Brain, AlertTriangle, Clock, Trophy } from 'lucide-react';

interface SessionStatsCardProps {
  stats: SessionStats;
}

export function SessionStatsCard({ stats }: SessionStatsCardProps) {
  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        Session Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <StatItem
          icon={<Clock className="w-3.5 h-3.5 text-primary" />}
          label="Total Time"
          value={`${stats.totalMinutes}m`}
        />
        <StatItem
          icon={<Activity className="w-3.5 h-3.5 text-emotion-flow" />}
          label="Flow Time"
          value={`${stats.flowMinutes}m`}
        />
        <StatItem
          icon={<Brain className="w-3.5 h-3.5 text-emotion-focused" />}
          label="Flow Streak"
          value={`${stats.longestFlowStreak}`}
        />
        <StatItem
          icon={<AlertTriangle className="w-3.5 h-3.5 text-emotion-confused" />}
          label="Confusion"
          value={`${stats.confusionClusters}x`}
        />
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Top state:</span>
          <span className={EMOTION_CONFIG[stats.topEmotion].colorClass}>
            {EMOTION_CONFIG[stats.topEmotion].emoji} {EMOTION_CONFIG[stats.topEmotion].label}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-2 rounded-md bg-secondary/30">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-bold font-mono text-foreground">{value}</span>
    </div>
  );
}
