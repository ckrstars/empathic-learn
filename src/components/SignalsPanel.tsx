import type { MultiModalSignals } from '@/types/emotion';
import { Keyboard, Mouse, ScrollText } from 'lucide-react';

interface SignalsPanelProps {
  signals: MultiModalSignals;
}

export function SignalsPanel({ signals }: SignalsPanelProps) {
  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">📡</span>
        Multi-Modal Signals
      </h3>
      <div className="space-y-3">
        <SignalBar
          icon={<Keyboard className="w-3.5 h-3.5" />}
          label="Typing Rhythm"
          value={signals.typingVariance}
          active={signals.isTyping}
          lowLabel="Steady"
          highLabel="Erratic"
        />
        <SignalBar
          icon={<Mouse className="w-3.5 h-3.5" />}
          label="Mouse Activity"
          value={signals.mouseIdlePercent}
          lowLabel="Active"
          highLabel="Idle"
        />
        <SignalBar
          icon={<ScrollText className="w-3.5 h-3.5" />}
          label="Re-reads"
          value={Math.min(signals.scrollRevisits / 10, 1)}
          lowLabel="Linear"
          highLabel="Backtracking"
        />
      </div>
    </div>
  );
}

function SignalBar({
  icon, label, value, active, lowLabel, highLabel,
}: {
  icon: React.ReactNode; label: string; value: number; active?: boolean; lowLabel: string; highLabel: string;
}) {
  const percent = Math.round(value * 100);
  const color = value < 0.3 ? 'bg-emotion-focused' : value < 0.6 ? 'bg-emotion-bored' : 'bg-emotion-confused';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
          {active !== undefined && (
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emotion-focused' : 'bg-muted'}`} />
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-muted-foreground/60">{lowLabel}</span>
        <span className="text-[9px] text-muted-foreground/60">{highLabel}</span>
      </div>
    </div>
  );
}
