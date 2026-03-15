import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EmotionState } from '@/types/emotion';

interface AITeachingAssistantProps {
  emotionState: EmotionState;
  topic: string;
  isSessionActive: boolean;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

export function AITeachingAssistant({ emotionState, topic, isSessionActive }: AITeachingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const confusionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-trigger when confused
  useEffect(() => {
    if (emotionState === 'confused' && isSessionActive && !isOpen && !autoTriggered) {
      confusionTimerRef.current = setTimeout(() => {
        setIsOpen(true);
        setAutoTriggered(true);
        sendMessage(`I'm confused about "${topic}". Can you explain it in simpler terms with an example?`, true);
      }, 5000);
    }
    return () => { if (confusionTimerRef.current) clearTimeout(confusionTimerRef.current); };
  }, [emotionState, isSessionActive, isOpen, autoTriggered, topic]);

  // Reset auto-trigger when emotion changes away from confused
  useEffect(() => {
    if (emotionState !== 'confused') setAutoTriggered(false);
  }, [emotionState]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string, isAuto = false) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          topic,
          emotionState,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(resp.status === 429 ? 'Rate limited, try again shortly.' : 'Failed to connect to AI tutor');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message || 'Something went wrong. Try again.'}` }]);
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, topic, emotionState]);

  if (!isSessionActive) return null;

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="w-6 h-6 text-primary-foreground" />
          {emotionState === 'confused' && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emotion-confused animate-pulse" />
          )}
        </motion.button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[520px] glass rounded-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI Teaching Assistant</h3>
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[380px]">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Ask me anything about your lesson!</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">I'll also pop up automatically when you're confused</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-xl px-3 py-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the topic..."
                  className="flex-1 text-sm"
                  disabled={isStreaming}
                />
                <Button type="submit" size="sm" disabled={isStreaming || !input.trim()} className="bg-primary text-primary-foreground">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
