import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { label: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
            <span className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</span>
            {subtitle && <span className="text-sm text-neutral-500 whitespace-nowrap">{subtitle}</span>}
          </div>
          {trend && (
            <p className={cn('mt-2 text-xs font-medium', trend.positive ? 'text-green-600' : 'text-red-600')}>
              ▲ {trend.label}
            </p>
          )}
        </div>
        {icon && <div className="p-2 rounded-xl bg-neutral-100 text-neutral-500">{icon}</div>}
      </div>
    </div>
  );
}
