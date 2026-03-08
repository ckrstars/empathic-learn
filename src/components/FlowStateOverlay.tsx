import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Lock } from 'lucide-react';

interface FlowStateOverlayProps {
  isInFlow: boolean;
  flowMinutes: number;
}

export function FlowStateOverlay({ isInFlow, flowMinutes }: FlowStateOverlayProps) {
  return (
    <AnimatePresence>
      {isInFlow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full emotion-gradient-flow animate-pulse-glow">
            <Flame className="w-5 h-5 text-foreground" />
            <span className="font-bold text-foreground text-sm">Flow State Active</span>
            <span className="text-foreground/70 text-xs font-mono">{flowMinutes}m</span>
            <Lock className="w-3.5 h-3.5 text-foreground/60" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
