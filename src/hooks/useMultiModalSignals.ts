import { useState, useEffect, useRef, useCallback } from 'react';
import type { MultiModalSignals } from '@/types/emotion';

export function useMultiModalSignals(): MultiModalSignals & { resetSignals: () => void } {
  const [typingVariance, setTypingVariance] = useState(0);
  const [mouseIdlePercent, setMouseIdlePercent] = useState(0);
  const [scrollRevisits, setScrollRevisits] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const keystrokeTimesRef = useRef<number[]>([]);
  const mouseMovesRef = useRef<number[]>([]);
  const scrollPositionsRef = useRef<number[]>([]);
  const lastMouseMoveRef = useRef(Date.now());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSignals = useCallback(() => {
    keystrokeTimesRef.current = [];
    mouseMovesRef.current = [];
    scrollPositionsRef.current = [];
    setTypingVariance(0);
    setMouseIdlePercent(0);
    setScrollRevisits(0);
  }, []);

  useEffect(() => {
    const handleKeydown = () => {
      const now = Date.now();
      keystrokeTimesRef.current.push(now);
      if (keystrokeTimesRef.current.length > 50) keystrokeTimesRef.current.shift();
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
    };

    const handleMouseMove = () => {
      const now = Date.now();
      mouseMovesRef.current.push(now);
      if (mouseMovesRef.current.length > 100) mouseMovesRef.current.shift();
      lastMouseMoveRef.current = now;
    };

    const handleScroll = () => {
      const pos = window.scrollY;
      const positions = scrollPositionsRef.current;
      if (positions.length > 2) {
        const prev = positions[positions.length - 1];
        const prevPrev = positions[positions.length - 2];
        if ((pos < prev && prev > prevPrev) || (pos > prev && prev < prevPrev)) {
          setScrollRevisits(r => r + 1);
        }
      }
      positions.push(pos);
      if (positions.length > 200) positions.splice(0, 100);
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Compute metrics every 5 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      // Typing variance
      const times = keystrokeTimesRef.current;
      if (times.length > 2) {
        const intervals: number[] = [];
        for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1]);
        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
        setTypingVariance(Math.min(variance / 10000, 1)); // normalize to 0-1
      }

      // Mouse idle
      const timeSinceMove = now - lastMouseMoveRef.current;
      setMouseIdlePercent(Math.min(timeSinceMove / 10000, 1)); // idle > 10s = 100%
    }, 5000);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return { typingVariance, mouseIdlePercent, scrollRevisits, isTyping, resetSignals };
}
