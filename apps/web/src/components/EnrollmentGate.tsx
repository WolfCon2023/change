/**
 * EnrollmentGate
 * Ensures client users have completed enrollment (active paid subscription) before accessing the app.
 * Platform users (advisor, admin) skip the gate. Others are redirected to /pricing to select a plan.
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { UserRole } from '@change/shared';

const PLATFORM_ROLES: string[] = [UserRole.SYSTEM_ADMIN, UserRole.PROGRAM_ADMIN, UserRole.ADVISOR];

interface BillingResponse {
  success: boolean;
  data?: {
    subscription?: {
      plan: string;
      status: string;
    };
  };
}

export function EnrollmentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [enrolled, setEnrolled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setEnrolled(false);
      return;
    }

    if (PLATFORM_ROLES.includes(user.role)) {
      setEnrolled(true);
      return;
    }

    let cancelled = false;
    api
      .get<BillingResponse>('/app/billing')
      .then((res) => {
        if (cancelled) return;
        const body = res.data;
        const sub = body?.data?.subscription;
        const hasPaidPlan =
          sub &&
          ['starter', 'professional', 'enterprise'].includes(sub.plan) &&
          ['active', 'trialing'].includes(sub.status);
        setEnrolled(!!hasPaidPlan);
      })
      .catch(() => {
        if (!cancelled) setEnrolled(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  if (enrolled === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!enrolled) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
