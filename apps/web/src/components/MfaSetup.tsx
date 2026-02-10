/**
 * MFA Setup Component
 * Allows users to enable/disable Two-Factor Authentication
 */

import { useState } from 'react';
import { Shield, Smartphone, Copy, Check, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { api } from '@/lib/api';

interface MfaSetupProps {
  mfaEnabled: boolean;
  mfaEnforced?: boolean;
  onStatusChange: () => void;
}

interface SetupData {
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export function MfaSetup({ mfaEnabled, mfaEnforced, onStatusChange }: MfaSetupProps) {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'backup' | 'disable'>('initial');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const handleInitiateSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/mfa/setup');
      setSetupData(response.data.data);
      setStep('setup');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to initiate MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/mfa/verify-setup', { token: verificationCode });
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = () => {
    setStep('initial');
    setSetupData(null);
    setVerificationCode('');
    onStatusChange();
  };

  const handleDisableMfa = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/mfa/disable', { password });
      setStep('initial');
      setPassword('');
      onStatusChange();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'key' | 'codes') => {
    await navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  // Initial state - show enable/disable button
  if (step === 'initial') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Badge variant={mfaEnabled ? 'success' : 'secondary'}>
              {mfaEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {mfaEnforced && !mfaEnabled && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Two-factor authentication is required for your account. Please enable it to continue.
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-4">
            {mfaEnabled 
              ? 'Your account is protected with two-factor authentication using an authenticator app.'
              : 'Use an authenticator app like Google Authenticator or Authy to generate verification codes.'}
          </p>

          {mfaEnabled ? (
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setStep('disable')}
            >
              Disable Two-Factor Authentication
            </Button>
          ) : (
            <Button onClick={handleInitiateSetup} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Smartphone className="h-4 w-4 mr-2" />
              Set Up Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Setup step - show QR code
  if (step === 'setup' && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Set Up Authenticator App</CardTitle>
          <CardDescription>
            Scan the QR code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white border rounded-lg">
              <img 
                src={setupData.qrCodeUrl} 
                alt="QR Code for authenticator app" 
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Manual Entry Key */}
          <div>
            <Label className="text-sm text-gray-500">Can't scan? Enter this key manually:</Label>
            <div className="flex items-center mt-2">
              <code className="flex-1 p-3 bg-gray-100 rounded-l-md font-mono text-sm break-all">
                {setupData.manualEntryKey}
              </code>
              <Button
                variant="outline"
                className="rounded-l-none"
                onClick={() => copyToClipboard(setupData.manualEntryKey.replace(/\s/g, ''), 'key')}
              >
                {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Verification */}
          <div>
            <Label htmlFor="verificationCode">Enter the 6-digit code from your app:</Label>
            <Input
              id="verificationCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="mt-2 text-center text-2xl tracking-widest font-mono"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep('initial'); setSetupData(null); }}>
              Cancel
            </Button>
            <Button onClick={handleVerifySetup} disabled={loading || verificationCode.length !== 6}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify and Enable
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Backup codes step
  if (step === 'backup' && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Check className="h-5 w-5 mr-2 text-green-600" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription>
            Save your backup codes in a safe place
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium mb-2">
              Important: Save these backup codes!
            </p>
            <p className="text-sm text-amber-700">
              You can use these codes to access your account if you lose access to your authenticator app.
              Each code can only be used once.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
            {setupData.backupCodes.map((code, index) => (
              <code key={index} className="font-mono text-sm text-center py-1">
                {code}
              </code>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
          >
            {copiedCodes ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copiedCodes ? 'Copied!' : 'Copy Backup Codes'}
          </Button>

          <Button className="w-full" onClick={handleFinishSetup}>
            I've Saved My Backup Codes
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Disable MFA step
  if (step === 'disable') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-600">Disable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter your password to confirm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Disabling two-factor authentication will make your account less secure.
              Are you sure you want to continue?
            </p>
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep('initial'); setPassword(''); setError(null); }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisableMfa} 
              disabled={loading || !password}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disable Two-Factor Authentication
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
