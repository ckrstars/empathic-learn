import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreathingBreakProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function BreathingBreak({ isVisible, onDismiss }: BreathingBreakProps) {
  const [timer, setTimer] = useState(30);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    if (!isVisible) { setTimer(30); return; }
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { onDismiss(); return 30; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible, onDismiss]);

  useEffect(() => {
    if (!isVisible) return;
    const cycle = setInterval(() => {
      setPhase(p => p === 'inhale' ? 'hold' : p === 'hold' ? 'exhale' : 'inhale');
    }, 4000);
    return () => clearInterval(cycle);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
        >
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="absolute top-4 right-4 text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </Button>

            <Wind className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Take a Breath</h2>
            <p className="text-muted-foreground mb-8">Your eyes indicate fatigue. Let's reset.</p>

            <div className="relative w-48 h-48 mx-auto mb-8">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                animate={{
                  scale: phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.3 : 1,
                  opacity: phase === 'hold' ? 0.8 : 0.5,
                }}
                transition={{ duration: 4, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-4 rounded-full bg-primary/10"
                animate={{
                  scale: phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.3 : 1,
                }}
                transition={{ duration: 4, ease: 'easeInOut' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold text-primary capitalize">{phase}</span>
              </div>
            </div>

            <span className="text-3xl font-mono text-muted-foreground">{timer}s</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
