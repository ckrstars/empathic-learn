import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EmotionState } from '@/types/emotion';

interface AdaptiveResponseProps {
  state: EmotionState;
  topic: string;
  onDismiss: () => void;
}

const EXPLANATIONS: Record<string, string[]> = {
  'What is Machine Learning?': [
    '🎯 ML is just pattern recognition — feed data in, get predictions out',
    '📊 Think: spreadsheet formulas that write themselves by looking at examples',
    '🔄 Three flavors: supervised (with answers), unsupervised (find patterns), reinforcement (trial & error)',
  ],
  'Neural Networks Explained': [
    '🧠 Neural nets are layers of math operations, loosely inspired by brain neurons',
    '📥 Data goes in → gets transformed layer by layer → answer comes out',
    '🔧 Training = adjusting millions of tiny knobs until the output matches what you want',
  ],
  'Training & Evaluation': [
    '🔁 Training loop: predict → check → adjust → repeat (thousands of times)',
    '⚖️ Overfitting = memorizing answers; Underfitting = too simple to learn',
    '📏 Always test on data the model has never seen before',
  ],
};

const QUIZZES: Record<string, { question: string; options: string[]; correct: number }[]> = {
  'What is Machine Learning?': [
    { question: 'Which type of ML learns from labeled data?', options: ['Unsupervised', 'Supervised', 'Reinforcement'], correct: 1 },
    { question: 'ML algorithms primarily learn from...', options: ['Hard-coded rules', 'Data patterns', 'Random guessing'], correct: 1 },
    { question: 'Reinforcement learning is most like...', options: ['Studying flashcards', 'Training a dog with treats', 'Reading a textbook'], correct: 1 },
  ],
  'Neural Networks Explained': [
    { question: 'What is backpropagation?', options: ['Forward data flow', 'Error-driven weight adjustment', 'Data preprocessing'], correct: 1 },
    { question: '"Deep learning" means...', options: ['Complex math', 'Many hidden layers', 'Big datasets'], correct: 1 },
    { question: 'The output layer produces...', options: ['Raw data', 'Weighted sums', 'Final predictions'], correct: 2 },
  ],
  'Training & Evaluation': [
    { question: 'What is overfitting?', options: ['Model is too complex', 'Model memorizes training data', 'Model trains too fast'], correct: 1 },
    { question: 'An epoch is...', options: ['One training sample', 'One pass through all data', 'One weight update'], correct: 1 },
    { question: 'Learning rate controls...', options: ['Data speed', 'Weight adjustment size', 'Network depth'], correct: 1 },
  ],
};

export function AdaptiveResponse({ state, topic, onDismiss }: AdaptiveResponseProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState(0);

  const isConfused = state === 'confused';
  const isBored = state === 'bored';

  if (!isConfused && !isBored) return null;

  const explanations = EXPLANATIONS[topic] || EXPLANATIONS['What is Machine Learning?'];
  const quizzes = QUIZZES[topic] || QUIZZES['What is Machine Learning?'];
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
              {isConfused ? 'Simplified Explanation' : 'Quick Challenge'}
            </h3>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isConfused && (
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

        {isBored && quiz && (
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
