'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, AlertCircle } from 'lucide-react';
import { formatMinutes, UsageStats } from '@/lib/usageTracker';
import { Button } from '@/components/ui/button';

export function UsageIndicator() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  const getColor = () => {
    if (stats.isOverLimit) return 'text-red-600 dark:text-red-400';
    if (stats.percentUsed >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-muted-foreground';
  };

  return (
    <Link href="/dashboard/usage">
      <Button variant="ghost" size="sm" className="gap-2">
        {stats.isOverLimit ? (
          <AlertCircle className={`h-4 w-4 ${getColor()}`} />
        ) : (
          <Clock className={`h-4 w-4 ${getColor()}`} />
        )}
        <span className={`text-sm ${getColor()}`}>
          {formatMinutes(stats.totalMinutes)} / {formatMinutes(stats.limitMinutes)}
        </span>
      </Button>
    </Link>
  );
}

