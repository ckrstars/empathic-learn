import { useState } from 'react';
import { ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LESSONS = [
  {
    id: 1,
    title: 'What is Machine Learning?',
    content: `Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.\n\nInstead of writing rules manually, ML algorithms use data to identify patterns and make decisions. Think of it like teaching a child to recognize dogs — you show them many pictures rather than describing every possible dog.\n\nThere are three main types:\n\n**Supervised Learning** — The algorithm learns from labeled training data. Like a student studying with an answer key.\n\n**Unsupervised Learning** — The algorithm finds hidden patterns in unlabeled data. Like grouping songs by mood without being told the categories.\n\n**Reinforcement Learning** — The algorithm learns by trial and error, receiving rewards or penalties. Like training a dog with treats.`,
  },
  {
    id: 2,
    title: 'Neural Networks Explained',
    content: `A Neural Network is inspired by the human brain. It consists of layers of interconnected nodes (neurons) that process information.\n\n**Input Layer** — Receives the raw data (pixels of an image, words of a sentence).\n\n**Hidden Layers** — Transform the data through weighted connections. Each neuron applies a mathematical function and passes the result forward. More layers = deeper network = "deep learning."\n\n**Output Layer** — Produces the final prediction or classification.\n\nDuring training, the network adjusts its weights using a process called **backpropagation**. When it makes a wrong prediction, the error signal flows backward through the network, tweaking each connection to reduce future errors.\n\nThis is like adjusting the knobs on a mixing board until the sound is perfect — except there are millions of knobs.`,
  },
  {
    id: 3,
    title: 'Training & Evaluation',
    content: `Training a model is an iterative process of feeding data, making predictions, and adjusting weights.\n\n**The Training Loop:**\n1. Feed a batch of data through the model\n2. Compare predictions to actual answers (calculate loss)\n3. Adjust weights via backpropagation\n4. Repeat thousands of times\n\n**Key Concepts:**\n\n**Overfitting** — The model memorizes training data but fails on new data. Like a student who memorizes answers but can't solve new problems.\n\n**Underfitting** — The model is too simple to capture patterns. Like trying to draw a circle with a ruler.\n\n**Validation Set** — Data held back from training to test generalization.\n\n**Epochs** — One complete pass through all training data. Most models need 10-100+ epochs.\n\n**Learning Rate** — How big of steps the model takes when adjusting weights. Too big = overshooting, too small = never converging.`,
  },
];

interface LessonPlayerProps {
  onTopicChange: (topic: string) => void;
}

export function LessonPlayer({ onTopicChange }: LessonPlayerProps) {
  const [currentLesson, setCurrentLesson] = useState(0);

  const lesson = LESSONS[currentLesson];

  const goToLesson = (index: number) => {
    setCurrentLesson(index);
    onTopicChange(LESSONS[index].title);
  };

  return (
    <div className="glass rounded-lg flex flex-col h-full">
      {/* Lesson nav */}
      <div className="p-3 border-b border-border flex items-center gap-2 overflow-x-auto">
        <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
        {LESSONS.map((l, i) => (
          <button
            key={l.id}
            onClick={() => goToLesson(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              i === currentLesson
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {l.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-foreground">{lesson.title}</h2>
        <div className="prose prose-invert max-w-none">
          {lesson.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="mb-4 text-secondary-foreground leading-relaxed">
              {paragraph.split('**').map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="text-foreground font-semibold">{part}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 border-t border-border flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToLesson(Math.max(0, currentLesson - 1))}
          disabled={currentLesson === 0}
          className="text-muted-foreground"
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground self-center font-mono">
          {currentLesson + 1} / {LESSONS.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToLesson(Math.min(LESSONS.length - 1, currentLesson + 1))}
          disabled={currentLesson === LESSONS.length - 1}
          className="text-muted-foreground"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
