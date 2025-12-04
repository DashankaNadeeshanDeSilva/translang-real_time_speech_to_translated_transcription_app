'use client';

import { useEffect, useState } from 'react';
import { Loader2, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatMinutes, UsageStats } from '@/lib/usageTracker';

interface UsageRecord {
  id: string;
  minutes: number;
  date: string;
}

interface UsageData {
  stats: UsageStats;
  records: UsageRecord[];
  tier: {
    name: string;
    limitMinutes: number;
  };
  monthStart: string;
}

export function UsageDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usage');
      
      if (!response.ok) {
        throw new Error('Failed to load usage data');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      console.error('Error loading usage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Failed to load usage data</p>
        </div>
        <p className="mt-1 text-sm">{error || 'Unknown error'}</p>
      </div>
    );
  }

  const { stats, tier, records } = data;
  const monthName = new Date(data.monthStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Determine progress bar color based on usage
  const getProgressColor = () => {
    if (stats.isOverLimit) return 'bg-red-500';
    if (stats.percentUsed >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Usage This Month</h3>
            <p className="text-sm text-muted-foreground">{monthName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{formatMinutes(stats.totalMinutes)}</p>
            <p className="text-sm text-muted-foreground">
              of {formatMinutes(stats.limitMinutes)} ({tier.name})
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={stats.percentUsed} 
            className="h-3"
            indicatorClassName={getProgressColor()}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {Math.round(stats.percentUsed)}% used
            </span>
            <span className={stats.isOverLimit ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
              {stats.isOverLimit ? 'Limit reached' : `${formatMinutes(stats.remainingMinutes)} remaining`}
            </span>
          </div>
        </div>

        {/* Warning Message */}
        {stats.isOverLimit && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  You&apos;ve reached your monthly limit
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  Upgrade to Pro for 600 minutes/month or Unlimited for no limits.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.percentUsed >= 80 && !stats.isOverLimit && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  Approaching your monthly limit
                </p>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  You have {formatMinutes(stats.remainingMinutes)} remaining this month.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Total Used</span>
          </div>
          <p className="text-2xl font-bold">{formatMinutes(stats.totalMinutes)}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Sessions</span>
          </div>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Avg. Session</span>
          </div>
          <p className="text-2xl font-bold">
            {records.length > 0
              ? formatMinutes(stats.totalMinutes / records.length)
              : '0m'}
          </p>
        </div>
      </div>

      {/* Recent Sessions */}
      {records.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {records.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(record.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-sm font-medium">
                  {formatMinutes(record.minutes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

