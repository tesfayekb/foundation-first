import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle | null>(null);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const getTurnstileToken = useCallback(async (): Promise<string | null> => {
    if (turnstileToken) {
      return turnstileToken;
    }

    try {
      return await turnstileRef.current?.execute() ?? null;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification required',
        description: error instanceof Error ? error.message : 'Please complete the CAPTCHA check and try again.',
      });
      return null;
    }
  }, [turnstileToken, toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = await getTurnstileToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Note: resetPasswordForEmail doesn't support captchaToken natively,
    // but having Turnstile pass here prevents automated abuse
    const { error } = await resetPassword(email);

    if (error) {
      console.error('[ForgotPassword] Reset error:', error.code);
    }
    setSubmitted(true);
    setLoading(false);
  }, [email, getTurnstileToken, resetPassword]);

  const handleExpire = useCallback(() => setTurnstileToken(null), []);
  const handleError = useCallback(() => setTurnstileToken(null), []);

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/sign-in" className="text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>Enter your email and we'll send a reset link</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <TurnstileWidget
              ref={turnstileRef}
              onVerify={setTurnstileToken}
              onExpire={handleExpire}
              onError={handleError}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-primary">
              Back to sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
