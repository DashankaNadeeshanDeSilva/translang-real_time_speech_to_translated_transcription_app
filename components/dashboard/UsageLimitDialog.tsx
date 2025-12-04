'use client';

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UsageStats, formatMinutes } from '@/lib/usageTracker';

interface UsageLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: UsageStats;
  onContinue?: () => void;
}

export function UsageLimitDialog({
  open,
  onOpenChange,
  stats,
  onContinue,
}: UsageLimitDialogProps) {
  const isOverLimit = stats.isOverLimit;
  const isNearLimit = stats.percentUsed >= 80 && !isOverLimit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-5 w-5 ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`} />
            <DialogTitle>
              {isOverLimit ? 'Usage Limit Reached' : 'Approaching Usage Limit'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isOverLimit ? (
              <>
                You&apos;ve used all <strong>{formatMinutes(stats.limitMinutes)}</strong> of your free plan this month.
              </>
            ) : (
              <>
                You have <strong>{formatMinutes(stats.remainingMinutes)}</strong> remaining this month
                ({Math.round(stats.percentUsed)}% used).
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isOverLimit ? (
            <div className="space-y-4">
              <p className="text-sm">
                To continue using TransLang, please upgrade to a paid plan:
              </p>
              <div className="space-y-2">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Pro Plan</p>
                      <p className="text-sm text-muted-foreground">600 minutes/month</p>
                    </div>
                    <p className="text-lg font-bold">$15/mo</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Unlimited Plan</p>
                      <p className="text-sm text-muted-foreground">No limits</p>
                    </div>
                    <p className="text-lg font-bold">$49/mo</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your usage will reset at the beginning of next month.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                You&apos;re approaching your free plan limit. Consider upgrading if you need more translation time.
              </p>
              <p className="text-xs text-muted-foreground">
                Your usage will reset at the beginning of next month.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {isOverLimit ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => {
                // TODO: Implement upgrade flow
                alert('Upgrade flow coming soon!');
              }}>
                Upgrade Plan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                onContinue?.();
                onOpenChange(false);
              }}>
                Continue Anyway
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

