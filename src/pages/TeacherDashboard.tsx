import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, AlertTriangle, BarChart3, Brain, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EMOTION_CONFIG, type EmotionState } from '@/types/emotion';
import type { SessionEvent } from '@/types/emotion';

interface SessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_minutes: number;
  flow_minutes: number;
  confusion_clusters: number;
  top_emotion: string;
  events: any;
  longest_flow_streak: number;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('session_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setSessions(data as SessionRow[]);
      setLoading(false);
    };
    load();
  }, [user]);

  // Compute analytics
  const analytics = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((s, r) => s + r.total_minutes, 0);
    const totalFlow = sessions.reduce((s, r) => s + r.flow_minutes, 0);
    const totalConfusion = sessions.reduce((s, r) => s + r.confusion_clusters, 0);
    const avgFlowPercent = totalMinutes > 0 ? Math.round((totalFlow / totalMinutes) * 100) : 0;

    // Attention heatmap: aggregate all events by emotion
    const emotionCounts: Record<string, number> = {};
    const topicDifficulty: Record<string, { confused: number; total: number }> = {};

    for (const session of sessions) {
      const events = (session.events || []) as SessionEvent[];
      for (const ev of events) {
        emotionCounts[ev.state] = (emotionCounts[ev.state] || 0) + 1;
        if (!topicDifficulty[ev.topic]) topicDifficulty[ev.topic] = { confused: 0, total: 0 };
        topicDifficulty[ev.topic].total++;
        if (ev.state === 'confused') topicDifficulty[ev.topic].confused++;
      }
    }

    // Confusion alerts: recent sessions with high confusion
    const confusionAlerts = sessions
      .filter(s => s.confusion_clusters >= 2)
      .slice(0, 5)
      .map(s => ({
        date: new Date(s.started_at).toLocaleDateString(),
        clusters: s.confusion_clusters,
        topEmotion: s.top_emotion,
        minutes: s.total_minutes,
      }));

    // Topic difficulty scores
    const difficulties = Object.entries(topicDifficulty)
      .map(([topic, d]) => ({
        topic,
        difficulty: d.total > 0 ? Math.round((d.confused / d.total) * 100) : 0,
        total: d.total,
      }))
      .sort((a, b) => b.difficulty - a.difficulty)
      .slice(0, 8);

    return {
      totalSessions,
      totalMinutes: Math.round(totalMinutes),
      avgFlowPercent,
      totalConfusion,
      emotionCounts,
      confusionAlerts,
      difficulties,
    };
  }, [sessions]);

  const emotionOrder: EmotionState[] = ['flow', 'focused', 'neutral', 'bored', 'confused', 'fatigued'];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          </Link>
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Teacher Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">Student attention analytics & confusion insights</p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading analytics...</div>
      ) : !analytics ? (
        <div className="text-center py-20">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No session data yet. Start learning to generate insights!</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Stats overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Sessions" value={analytics.totalSessions} />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Total Minutes" value={analytics.totalMinutes} />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Avg Flow %" value={`${analytics.avgFlowPercent}%`} color="text-emotion-focused" />
            <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Confusion Events" value={analytics.totalConfusion} color="text-emotion-confused" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Attention Heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">🗺️</span> Student Attention Heatmap
              </h2>
              <div className="space-y-2">
                {emotionOrder.map(emotion => {
                  const count = analytics.emotionCounts[emotion] || 0;
                  const totalEvents = Object.values(analytics.emotionCounts).reduce((a, b) => a + b, 0);
                  const percent = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
                  const config = EMOTION_CONFIG[emotion];
                  return (
                    <div key={emotion} className="flex items-center gap-3">
                      <span className="text-sm w-6 text-center">{config.emoji}</span>
                      <span className="text-xs text-muted-foreground w-16">{config.label}</span>
                      <div className="flex-1 h-6 rounded bg-secondary/50 overflow-hidden relative">
                        <motion.div
                          className={`h-full ${config.gradientClass} rounded`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, delay: emotionOrder.indexOf(emotion) * 0.1 }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-foreground">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Topic Difficulty Scores */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span> Topic Difficulty Score
              </h2>
              {analytics.difficulties.length === 0 ? (
                <p className="text-xs text-muted-foreground">No topic data yet</p>
              ) : (
                <div className="space-y-2">
                  {analytics.difficulties.map((d, i) => (
                    <div key={d.topic} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground truncate w-32" title={d.topic}>{d.topic}</span>
                      <div className="flex-1 h-4 rounded bg-secondary/50 overflow-hidden relative">
                        <motion.div
                          className={`h-full rounded ${d.difficulty > 50 ? 'bg-emotion-fatigued' : d.difficulty > 25 ? 'bg-emotion-confused' : 'bg-emotion-focused'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${d.difficulty}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{d.difficulty}%</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Confusion Alerts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emotion-confused" />
              Confusion Alerts
            </h2>
            {analytics.confusionAlerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No confusion alerts — great focus! 🎉</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.confusionAlerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-3 rounded-lg bg-emotion-confused/10 border border-emotion-confused/20"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{alert.date}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{alert.minutes}m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emotion-confused font-medium">
                        {alert.clusters} confusion cluster{alert.clusters > 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Top: {EMOTION_CONFIG[alert.topEmotion as EmotionState]?.emoji || '😐'} {alert.topEmotion}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className={`text-2xl font-bold font-mono ${color || 'text-foreground'}`}>{value}</p>
    </motion.div>
  );
}
