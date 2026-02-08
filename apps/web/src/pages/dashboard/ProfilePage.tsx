import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRole, formatDateTime } from '@/lib/utils';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

export function ProfilePage() {
  const { user, accessToken } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [changeResult, setChangeResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setChangeResult({ success: false, message: 'New passwords do not match' });
      return;
    }
    
    if (newPassword.length < 8) {
      setChangeResult({ success: false, message: 'New password must be at least 8 characters' });
      return;
    }
    
    setIsChanging(true);
    setChangeResult(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      await axios.post(
        `${API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      setChangeResult({ success: true, message: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to change password';
      setChangeResult({ success: false, message });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-primary">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{formatRole(user?.role ?? '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Verified</span>
                <span className="font-medium">
                  {user?.emailVerified ? (
                    <span className="text-success">Verified</span>
                  ) : (
                    <span className="text-warning">Pending</span>
                  )}
                </span>
              </div>
              {user?.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium">{formatDateTime(user.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <span className="font-medium text-success">Account Active</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono text-sm">{user?.id?.slice(-8)}</span>
              </div>
              {user?.tenantId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant ID</span>
                  <span className="font-mono text-sm">{user.tenantId.slice(-8)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {changeResult && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              changeResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {changeResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{changeResult.message}</span>
            </div>
          )}
          
          {!showChangePassword ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed: Unknown</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowChangePassword(true)}>
                Change Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" disabled={isChanging}>
                  {isChanging ? 'Changing...' : 'Change Password'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setChangeResult(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
