import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema } from '@change/shared';
import type { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Shield, ArrowLeft } from 'lucide-react';

type LoginFormData = z.infer<typeof loginRequestSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithMfa, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginRequestSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('[Login] onSubmit called');
    try {
      console.log('[Login] Attempting login...');
      const result = await login(data.email!, data.password!);
      console.log('[Login] Result:', JSON.stringify(result));
      
      // Check if MFA is required
      if (result && result.requiresMfa && result.mfaToken) {
        console.log('[Login] MFA required, setting state...');
        console.log('[Login] mfaToken value:', result.mfaToken);
        setMfaRequired(true);
        setMfaToken(result.mfaToken);
        console.log('[Login] State set, returning from onSubmit');
        return;
      }
      
      console.log('[Login] No MFA required, navigating to dashboard');
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('[Login] Error caught:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
      console.error('[Login] Error message:', errorMessage);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: errorMessage,
      });
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError(null);

    if (mfaCode.length !== 6) {
      setMfaError('Please enter a 6-digit code');
      return;
    }

    try {
      await loginWithMfa(mfaToken!, mfaCode);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Invalid verification code');
    }
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setMfaToken(null);
    setMfaCode('');
    setMfaError(null);
  };

  // Debug: Log current state on every render
  console.log('[Login] Render - mfaRequired:', mfaRequired, 'mfaToken:', mfaToken ? 'SET' : 'NULL');

  // MFA verification step
  if (mfaRequired) {
    console.log('[Login] Rendering MFA form');
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleMfaSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfaCode">Verification Code</Label>
              <Input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>
            {mfaError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {mfaError}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Open your authenticator app (Google Authenticator, Authy, etc.) and enter the code shown.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={mfaCode.length !== 6}>
              Verify
            </Button>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your email and password to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
