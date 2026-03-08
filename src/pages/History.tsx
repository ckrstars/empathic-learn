import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, ArrowLeft, Clock, Flame, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { JourneyMap } from '@/components/JourneyMap';
import { EMOTION_CONFIG } from '@/types/emotion';
import type { SessionEvent } from '@/types/emotion';

interface SessionRecord {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_minutes: number;
  flow_minutes: number;
  longest_flow_streak: number;
  confusion_clusters: number;
  top_emotion: string;
  events: SessionEvent[];
}

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('session_history')
      .select('*')
      .order('started_at', { ascending: false })
      .then(({ data }) => {
        setSessions((data as unknown as SessionRecord[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const totalFlow = sessions.reduce((s, r) => s + r.flow_minutes, 0);
  const totalMinutes = sessions.reduce((s, r) => s + r.total_minutes, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <Brain className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Session History</h1>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Clock, label: 'Total Time', value: `${Math.round(totalMinutes)}m` },
          { icon: Flame, label: 'Flow Time', value: `${Math.round(totalFlow)}m` },
          { icon: TrendingUp, label: 'Sessions', value: sessions.length },
          { icon: AlertTriangle, label: 'Avg Flow %', value: totalMinutes > 0 ? `${Math.round(totalFlow / totalMinutes * 100)}%` : '0%' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass rounded-xl p-3 border border-border/30">
            <Icon className="w-4 h-4 text-primary mb-1" />
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Flow Progress Chart */}
      {!loading && sessions.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl border border-border/30 p-4 mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Flow Minutes Over Time
          </h3>
          <FlowChart sessions={sessions} />
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No sessions yet</p>
          <p className="text-sm">Complete a learning session to see your history here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const emotionCfg = EMOTION_CONFIG[s.top_emotion as keyof typeof EMOTION_CONFIG] ?? EMOTION_CONFIG.neutral;
            const date = new Date(s.started_at);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-border/30 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emotionCfg.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(s.total_minutes)}m total · {Math.round(s.flow_minutes)}m flow · {s.confusion_clusters} confusion clusters
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{emotionCfg.label}</div>
                </button>
                {expandedId === s.id && s.events.length > 0 && (
                  <div className="px-4 pb-4">
                    <JourneyMap events={s.events} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
