import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, HelpCircle, X, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { EmotionState } from '@/types/emotion';

interface AdaptiveResponseProps {
  state: EmotionState;
  topic: string;
  lessonContent?: string;
  onDismiss: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export function AdaptiveResponse({ state, topic, lessonContent, onDismiss }: AdaptiveResponseProps) {
  const [explanations, setExplanations] = useState<string[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfused = state === 'confused';
  const isBored = state === 'bored';

  const fetchContent = useCallback(async () => {
    if (!isConfused && !isBored) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('adaptive-content', {
        body: {
          type: isConfused ? 'explain' : 'quiz',
          topic,
          lessonContent: lessonContent || topic,
        },
      });

      if (fnError) throw fnError;

      if (isConfused && data?.explanations) {
        setExplanations(data.explanations);
      } else if (isBored && data?.questions) {
        setQuizzes(data.questions);
        setCurrentQuiz(0);
        setSelectedAnswer(null);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      console.error('Adaptive content error:', err);
      setError(err?.message || 'Failed to generate content');
      // Fallback to static content
      if (isConfused) {
        setExplanations([
          '🎯 Think of this concept as a simple pattern — input goes in, transformation happens, output comes out',
          '📊 It\'s like a recipe: ingredients (data) + steps (algorithm) = dish (result)',
          '🔄 Don\'t worry about the math — focus on the intuition first, details come later',
        ]);
      } else {
        setQuizzes([
          { question: `What is the key idea behind ${topic}?`, options: ['Pattern recognition', 'Random guessing', 'Manual coding'], correct: 0 },
          { question: 'Why is this concept important?', options: ['It isn\'t', 'It automates learning from data', 'It replaces computers'], correct: 1 },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConfused, isBored, topic, lessonContent]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  if (!isConfused && !isBored) return null;

  const quiz = quizzes[currentQuiz];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="glass rounded-lg p-5 border border-border"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {isConfused ? (
              <Lightbulb className="w-5 h-5 text-emotion-confused" />
            ) : (
              <HelpCircle className="w-5 h-5 text-emotion-bored" />
            )}
            <h3 className="font-semibold text-foreground">
              {isConfused ? 'AI Simplified Explanation' : 'AI Quick Challenge'}
            </h3>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">AI is generating content...</span>
          </div>
        )}

        {error && !isLoading && (
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <span className="text-emotion-confused">⚡</span> Using fallback content
          </p>
        )}

        {!isLoading && isConfused && explanations.length > 0 && (
          <div className="space-y-3">
            {explanations.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="p-3 rounded-md bg-secondary/50 text-sm text-secondary-foreground"
              >
                {exp}
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && isBored && quiz && (
          <div>
            <p className="text-sm text-foreground font-medium mb-3">{quiz.question}</p>
            <div className="space-y-2">
              {quiz.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAnswer(i)}
                  className={`w-full text-left p-3 rounded-md text-sm transition-all ${
                    selectedAnswer === null
                      ? 'bg-secondary/50 hover:bg-secondary text-secondary-foreground'
                      : i === quiz.correct
                        ? 'bg-emotion-focused/20 text-emotion-focused border border-emotion-focused/30'
                        : selectedAnswer === i
                          ? 'bg-destructive/20 text-destructive border border-destructive/30'
                          : 'bg-secondary/30 text-muted-foreground'
                  }`}
                  disabled={selectedAnswer !== null}
                >
                  <div className="flex items-center gap-2">
                    {selectedAnswer !== null && i === quiz.correct && <CheckCircle2 className="w-4 h-4" />}
                    {option}
                  </div>
                </button>
              ))}
            </div>
            {selectedAnswer !== null && currentQuiz < quizzes.length - 1 && (
              <Button
                size="sm"
                className="mt-3 bg-primary text-primary-foreground"
                onClick={() => { setCurrentQuiz(q => q + 1); setSelectedAnswer(null); }}
              >
                Next Question
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
