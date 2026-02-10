/**
 * Billing Page
 * Subscription management and billing settings
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Check,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  Crown,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { api } from '../../lib/api';

interface Subscription {
  plan: string;
  planName: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

interface PlanLimits {
  documentsPerMonth: number;
  maxUsers: number;
  advisorSupport: string;
  customTemplates: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
}

interface BillingData {
  subscription: Subscription;
  limits: PlanLimits;
  features: string[];
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: Check },
  trialing: { label: 'Trial', color: 'bg-blue-100 text-blue-800', icon: Sparkles },
  past_due: { label: 'Past Due', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-800', icon: Clock },
  incomplete: { label: 'Incomplete', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
};

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-purple-100 text-purple-800',
  enterprise: 'bg-amber-100 text-amber-800',
};

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check for success/canceled URL params from Stripe redirect
  const checkoutSuccess = searchParams.get('success') === 'true';
  const checkoutCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const response = await api.get('/app/billing');
      if (response.data.success) {
        setBillingData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await api.post('/app/billing/portal');
      if (response.data.success && response.data.data.url) {
        window.location.href = response.data.data.url;
      }
    } catch (error: any) {
      console.error('Failed to open billing portal:', error);
      alert(error.response?.data?.error?.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.')) {
      return;
    }

    setActionLoading('cancel');
    try {
      await api.post('/app/billing/cancel');
      await fetchBillingData();
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      alert(error.response?.data?.error?.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading('reactivate');
    try {
      await api.post('/app/billing/reactivate');
      await fetchBillingData();
    } catch (error: any) {
      console.error('Failed to reactivate subscription:', error);
      alert(error.response?.data?.error?.message || 'Failed to reactivate subscription');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const subscription = billingData?.subscription;
  const limits = billingData?.limits;
  const features = billingData?.features || [];
  const statusConfig = STATUS_CONFIG[subscription?.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
  const planColor = PLAN_COLORS[subscription?.plan as keyof typeof PLAN_COLORS] || PLAN_COLORS.free;

  return (
    <div className="space-y-6">
      {/* Success/Canceled Alerts */}
      {checkoutSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <p className="font-medium text-green-800">Subscription activated!</p>
            <p className="text-sm text-green-700">Thank you for subscribing. Your plan is now active.</p>
          </div>
        </div>
      )}
      {checkoutCanceled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
          <div>
            <p className="font-medium text-yellow-800">Checkout canceled</p>
            <p className="text-sm text-yellow-700">Your subscription was not changed.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500">Manage your subscription and billing settings</p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-amber-500" />
                Current Plan
              </CardTitle>
              <CardDescription>Your subscription details</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={planColor}>{subscription?.planName || 'Free'}</Badge>
              <Badge className={statusConfig.color}>
                <statusConfig.icon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Plan Features</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Billing Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Billing Information</h3>
              <div className="space-y-3 text-sm">
                {subscription?.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial ends</span>
                    <span className="font-medium text-blue-600">
                      {new Date(subscription.trialEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription?.currentPeriodEnd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {subscription.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}
                    </span>
                    <span className="font-medium">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription?.cancelAtPeriodEnd && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Your subscription will be canceled at the end of the current billing period.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={handleReactivateSubscription}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === 'reactivate' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Reactivate Subscription
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
            {subscription?.plan !== 'free' && (
              <Button onClick={handleManageSubscription} disabled={portalLoading}>
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Manage Subscription
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              {subscription?.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
            </Button>
            {subscription?.plan !== 'free' && !subscription?.cancelAtPeriodEnd && (
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleCancelSubscription}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage & Limits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Your current usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Documents per month</p>
              <p className="text-2xl font-bold text-gray-900">
                {limits?.documentsPerMonth === -1 ? 'Unlimited' : limits?.documentsPerMonth || 3}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Team members</p>
              <p className="text-2xl font-bold text-gray-900">
                {limits?.maxUsers === -1 ? 'Unlimited' : limits?.maxUsers || 1}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Advisor support</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {limits?.advisorSupport || 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA for free users */}
      {subscription?.plan === 'free' && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Upgrade to unlock more features</h3>
                <p className="text-blue-100">
                  Get unlimited documents, priority support, and more with a paid plan.
                </p>
              </div>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/pricing')}
                className="whitespace-nowrap"
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
