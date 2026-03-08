import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await (await import('@/hooks/useAuth')).useAuth().signIn(email, password);
      // We can't call hooks like this — use inline supabase call instead
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">EmotiLearn</h1>
          </div>
          <p className="text-sm text-muted-foreground">Emotion-Aware Learning System</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <AuthForm
            isLogin={isLogin}
            email={email}
            password={password}
            displayName={displayName}
            submitting={submitting}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onDisplayNameChange={setDisplayName}
            onSubmit={async () => {
              setSubmitting(true);
              const { supabase } = await import('@/integrations/supabase/client');
              if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
              } else {
                const { error } = await supabase.auth.signUp({
                  email, password,
                  options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin },
                });
                if (error) {
                  toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
                } else {
                  toast({ title: 'Check your email', description: 'We sent a verification link to confirm your account.' });
                }
              }
              setSubmitting(false);
            }}
          />

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AuthForm({
  isLogin, email, password, displayName, submitting,
  onEmailChange, onPasswordChange, onDisplayNameChange, onSubmit,
}: {
  isLogin: boolean; email: string; password: string; displayName: string; submitting: boolean;
  onEmailChange: (v: string) => void; onPasswordChange: (v: string) => void;
  onDisplayNameChange: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Display Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="name" value={displayName} onChange={e => onDisplayNameChange(e.target.value)}
              placeholder="Your name" className="pl-10" required />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="email" type="email" value={email} onChange={e => onEmailChange(e.target.value)}
            placeholder="you@example.com" className="pl-10" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input id="password" type="password" value={password} onChange={e => onPasswordChange(e.target.value)}
            placeholder="••••••••" className="pl-10" minLength={6} required />
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground">
        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLogin ? 'Sign In' : 'Create Account'}
      </Button>
    </form>
  );
}
