/**
 * Notifications Admin Page
 * Manage and test email notifications
 */

import { useState } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

interface NotificationResult {
  sent: number;
  failed: number;
  skipped: number;
  details: Array<{
    userId: string;
    email: string;
    itemTitle: string;
    success: boolean;
    reason?: string;
  }>;
}

export function NotificationsPage() {
  const { accessToken } = useAuthStore();
  
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<NotificationResult | null>(null);
  
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState<{ schedulerRunning: boolean; smtpConfigured: boolean } | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  const sendTestEmail = async () => {
    if (!testEmail) return;
    
    setIsSendingTest(true);
    setTestResult(null);
    
    try {
      const response = await axios.post(
        `${apiBase}/admin/notifications/test-email`,
        { email: testEmail },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      setTestResult({
        success: response.data.data.sent,
        message: response.data.data.message,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send test email',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const triggerNotificationCheck = async () => {
    setIsRunningCheck(true);
    setCheckResult(null);
    
    try {
      const response = await axios.post(
        `${apiBase}/admin/notifications/trigger-check`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      setCheckResult(response.data.data);
    } catch (error) {
      console.error('Failed to trigger notification check:', error);
    } finally {
      setIsRunningCheck(false);
    }
  };

  const fetchStatus = async () => {
    setStatusLoading(true);
    
    try {
      const response = await axios.get(
        `${apiBase}/admin/notifications/status`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      setStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Notifications</h1>
        <p className="text-gray-600">Manage and test compliance reminder notifications</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification System Status
          </h2>
          <Button variant="outline" size="sm" onClick={fetchStatus} disabled={statusLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {status ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {status.smtpConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium text-gray-900">SMTP Configuration</p>
                <p className="text-sm text-gray-500">
                  {status.smtpConfigured ? 'Configured and ready' : 'Not configured'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {status.schedulerRunning ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-gray-900">Scheduler</p>
                <p className="text-sm text-gray-500">
                  {status.schedulerRunning ? 'Running (hourly checks)' : 'Not running'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Click refresh to check status</p>
        )}
      </div>

      {/* Test Email Card */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5" />
          Send Test Email
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Send a test email to verify your SMTP configuration is working correctly.
        </p>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="testEmail" className="sr-only">Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="Enter email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <Button onClick={sendTestEmail} disabled={isSendingTest || !testEmail}>
            {isSendingTest ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Test
          </Button>
        </div>
        
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
            testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Manual Check Card */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5" />
          Manual Notification Check
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Manually trigger a compliance reminder check. This will scan all compliance items 
          and send reminders for items due within 14 days or overdue.
        </p>
        
        <Button onClick={triggerNotificationCheck} disabled={isRunningCheck}>
          {isRunningCheck ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Run Notification Check
        </Button>
        
        {checkResult && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{checkResult.sent}</p>
                <p className="text-sm text-green-700">Sent</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{checkResult.failed}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-600">{checkResult.skipped}</p>
                <p className="text-sm text-gray-700">Skipped</p>
              </div>
            </div>
            
            {checkResult.details.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Details:</h3>
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {checkResult.details.map((detail, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{detail.email}</p>
                        <p className="text-gray-500">{detail.itemTitle}</p>
                      </div>
                      {detail.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          <span className="text-xs">{detail.reason}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {checkResult.sent === 0 && checkResult.failed === 0 && (
              <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2 text-blue-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>No reminders needed at this time. Reminders are sent when compliance items are due within 14 days.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How Notifications Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The system automatically checks for upcoming compliance deadlines every hour</li>
          <li>• Reminders are sent at: 14 days, 7 days, 3 days, and 1 day before due date</li>
          <li>• Overdue items receive weekly reminder emails</li>
          <li>• Each user only receives one reminder per compliance item per day</li>
        </ul>
      </div>
    </div>
  );
}
