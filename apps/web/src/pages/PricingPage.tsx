/**
 * Pricing Page
 * Display subscription plans and pricing
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../stores/auth.store';
import { api } from '../lib/api';

interface PlanFeature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

const FEATURES: PlanFeature[] = [
  { name: 'Documents per month', starter: '20', professional: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Users included', starter: '1', professional: '5', enterprise: 'Unlimited' },
  { name: 'All document templates', starter: true, professional: true, enterprise: true },
  { name: 'Email support', starter: true, professional: true, enterprise: true },
  { name: 'Priority advisor support', starter: false, professional: true, enterprise: true },
  { name: 'Dedicated advisor', starter: false, professional: false, enterprise: true },
  { name: 'API access', starter: false, professional: true, enterprise: true },
  { name: 'Custom templates', starter: false, professional: false, enterprise: true },
  { name: 'White-label options', starter: false, professional: false, enterprise: true },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses',
    monthlyPrice: 29,
    annualPrice: 290,
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    monthlyPrice: 79,
    annualPrice: 790,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 199,
    annualPrice: 1990,
    popular: false,
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to register with plan info
      navigate(`/register?plan=${planId}&interval=${interval}`);
      return;
    }

    setLoading(planId);
    try {
      const response = await api.post('/app/billing/checkout', {
        plan: planId,
        interval,
      });

      if (response.data.success && response.data.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error?.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src="/logo-v2.png" alt="CHANGE" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">CHANGE</span>
            </div>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => navigate('/app')}>
                <span className="hidden sm:inline">Back to </span>Dashboard
              </Button>
            ) : (
              <div className="flex space-x-2 sm:space-x-3">
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate('/register')} className="hidden sm:inline-flex">
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="py-10 sm:py-16 px-4 text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8">
          Choose the plan that's right for your business. All plans include a 7-day free trial.
        </p>

        {/* Interval Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 mb-8 sm:mb-12">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              interval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setInterval('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              interval === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setInterval('annual')}
          >
            Annual
            <span className="ml-2 text-xs text-green-600 font-semibold">Save 17%</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600 order-first sm:order-none' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-sm py-1 text-center font-medium">
                  Most Popular
                </div>
              )}
              <div className={`p-6 sm:p-8 ${plan.popular ? 'pt-10 sm:pt-12' : ''}`}>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{plan.description}</p>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ${interval === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                  </span>
                  <span className="text-gray-600">/month</span>
                  {interval === 'annual' && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      ${plan.annualPrice} billed annually
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Start Free Trial'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-8">
          Compare Features
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="py-3 sm:py-4 px-4 sm:px-6 text-left font-medium text-gray-900 text-sm sm:text-base">Feature</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="py-3 sm:py-4 px-3 sm:px-6 text-center font-medium text-gray-900 text-sm sm:text-base">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, index) => (
                <tr key={feature.name} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-3 sm:py-4 px-4 sm:px-6 text-gray-700 text-sm sm:text-base">{feature.name}</td>
                  {(['starter', 'professional', 'enterprise'] as const).map((planId) => (
                    <td key={planId} className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                      {typeof feature[planId] === 'boolean' ? (
                        feature[planId] ? (
                          <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-900 font-medium text-sm sm:text-base">{feature[planId]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens after my free trial?</h3>
              <p className="text-gray-600">
                After your 7-day trial, you'll be charged for your selected plan. You can cancel anytime before the trial ends.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact support for a full refund.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} CHANGE Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
