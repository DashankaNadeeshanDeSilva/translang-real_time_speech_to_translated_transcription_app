'use client';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';

function UsagePage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Usage & Limits</h1>
        <p className="text-muted-foreground">
          Track your translation usage and manage your plan
        </p>
      </div>

      <UsageDashboard />
    </div>
  );
}

export default withPageAuthRequired(UsagePage, {
  returnTo: '/dashboard/usage',
});

