import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MfaSetup } from '@/components/MfaSetup';
import { formatRole, formatDateTime } from '@/lib/utils';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Bell, Mail, Calendar, FileText, Megaphone } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';

interface NotificationPreferences {
  emailNotifications: boolean;
  complianceReminders: boolean;
  taskReminders: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

export function ProfilePage() {
  const { user, accessToken, refreshUser } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [changeResult, setChangeResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // MFA status state
  const [mfaStatus, setMfaStatus] = useState({ enabled: false, enforced: false });
  const [isLoadingMfa, setIsLoadingMfa] = useState(true);
  
  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    complianceReminders: true,
    taskReminders: true,
    weeklyDigest: false,
    marketingEmails: false,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsResult, setPrefsResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Load MFA status on mount
  useEffect(() => {
    const loadMfaStatus = async () => {
      try {
        const response = await api.get('/mfa/status');
        setMfaStatus(response.data.data);
      } catch (err) {
        console.error('Failed to load MFA status:', err);
      } finally {
        setIsLoadingMfa(false);
      }
    };
    
    if (accessToken) {
      loadMfaStatus();
    }
  }, [accessToken]);
  
  // Load notification preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/auth/notification-preferences`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setNotifPrefs(response.data.data);
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setIsLoadingPrefs(false);
      }
    };
    
    if (accessToken) {
      loadPreferences();
    }
  }, [accessToken, API_URL]);
  
  // Reload MFA status after changes
  const handleMfaStatusChange = async () => {
    try {
      const response = await api.get('/mfa/status');
      setMfaStatus(response.data.data);
      // Refresh user data in auth store
      if (refreshUser) {
        refreshUser();
      }
    } catch (err) {
      console.error('Failed to reload MFA status:', err);
    }
  };
  
  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    const newValue = !notifPrefs[key];
    const updatedPrefs = { ...notifPrefs, [key]: newValue };
    
    // If turning off email notifications, turn off all other email-related prefs
    if (key === 'emailNotifications' && !newValue) {
      updatedPrefs.complianceReminders = false;
      updatedPrefs.taskReminders = false;
      updatedPrefs.weeklyDigest = false;
      updatedPrefs.marketingEmails = false;
    }
    
    setNotifPrefs(updatedPrefs);
    setIsSavingPrefs(true);
    setPrefsResult(null);
    
    try {
      await axios.put(
        `${API_URL}/auth/notification-preferences`,
        updatedPrefs,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setPrefsResult({ success: true, message: 'Preferences saved' });
      setTimeout(() => setPrefsResult(null), 2000);
    } catch (err) {
      // Revert on error
      setNotifPrefs(notifPrefs);
      setPrefsResult({ success: false, message: 'Failed to save preferences' });
    } finally {
      setIsSavingPrefs(false);
    }
  };
  
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

      {/* Two-Factor Authentication */}
      {!isLoadingMfa && (
        <MfaSetup
          mfaEnabled={mfaStatus.enabled}
          mfaEnforced={mfaStatus.enforced}
          onStatusChange={handleMfaStatusChange}
        />
      )}

      {/* Notification Preferences Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </div>
            {prefsResult && (
              <span className={`text-sm flex items-center gap-1 ${
                prefsResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {prefsResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {prefsResult.message}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPrefs ? (
            <div className="text-center py-4 text-muted-foreground">Loading preferences...</div>
          ) : (
            <>
              {/* Master Email Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePreference('emailNotifications')}
                  disabled={isSavingPrefs}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifPrefs.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifPrefs.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Individual Notification Types */}
              <div className={`space-y-3 pl-4 ${!notifPrefs.emailNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Compliance Reminders */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Compliance Reminders</p>
                      <p className="text-sm text-muted-foreground">Reminders for upcoming compliance deadlines</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('complianceReminders')}
                    disabled={isSavingPrefs || !notifPrefs.emailNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifPrefs.complianceReminders ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs.complianceReminders ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Task Reminders */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Task Reminders</p>
                      <p className="text-sm text-muted-foreground">Reminders for pending tasks and to-dos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('taskReminders')}
                    disabled={isSavingPrefs || !notifPrefs.emailNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifPrefs.taskReminders ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs.taskReminders ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Weekly Digest */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Weekly Digest</p>
                      <p className="text-sm text-muted-foreground">Weekly summary of your business activity</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('weeklyDigest')}
                    disabled={isSavingPrefs || !notifPrefs.emailNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifPrefs.weeklyDigest ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-medium">Marketing & Updates</p>
                      <p className="text-sm text-muted-foreground">News, tips, and product updates</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePreference('marketingEmails')}
                    disabled={isSavingPrefs || !notifPrefs.emailNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifPrefs.marketingEmails ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifPrefs.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
