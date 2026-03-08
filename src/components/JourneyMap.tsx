import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { SessionEvent, EmotionState } from '@/types/emotion';
import { EMOTION_CONFIG } from '@/types/emotion';

interface JourneyMapProps {
  events: SessionEvent[];
}

const stateToValue: Record<EmotionState, number> = {
  fatigued: 0, bored: 1, confused: 2, neutral: 3, focused: 4, flow: 5,
};

const stateColors: Record<EmotionState, string> = {
  flow: 'hsl(270, 80%, 65%)',
  focused: 'hsl(152, 70%, 45%)',
  confused: 'hsl(30, 90%, 55%)',
  bored: 'hsl(45, 90%, 55%)',
  fatigued: 'hsl(0, 75%, 55%)',
  neutral: 'hsl(210, 15%, 50%)',
};

export function JourneyMap({ events }: JourneyMapProps) {
  const chartData = useMemo(() => {
    if (events.length === 0) return [];
    const startTime = events[0].timestamp;
    return events.map(e => ({
      time: Math.round((e.timestamp - startTime) / 1000),
      value: stateToValue[e.state],
      state: e.state,
      topic: e.topic,
      label: EMOTION_CONFIG[e.state].label,
    }));
  }, [events]);

  if (chartData.length < 2) {
    return (
      <div className="glass rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Journey map will appear as your session progresses...
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="glass rounded-md px-3 py-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: stateColors[data.state as EmotionState] }} />
          <span className="font-semibold">{data.label}</span>
        </div>
        <p className="text-muted-foreground">{data.topic}</p>
        <p className="text-muted-foreground font-mono">{data.time}s</p>
      </div>
    );
  };

  return (
    <div className="glass rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="text-lg">🗺️</span> Emotional Journey Map
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(185, 80%, 48%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(185, 80%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 15%, 18%)" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
            tickFormatter={v => `${v}s`}
            stroke="hsl(230, 15%, 18%)"
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tickFormatter={v => ['😩', '😴', '😕', '😐', '🎯', '🔥'][v]}
            tick={{ fontSize: 12 }}
            width={30}
            stroke="hsl(230, 15%, 18%)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="stepAfter"
            dataKey="value"
            stroke="hsl(185, 80%, 48%)"
            strokeWidth={2}
            fill="url(#journeyGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {Object.entries(EMOTION_CONFIG).map(([state, config]) => (
          <div key={state} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full" style={{ background: stateColors[state as EmotionState] }} />
            {config.emoji} {config.label}
          </div>
        ))}
      </div>
    </div>
  );
}
