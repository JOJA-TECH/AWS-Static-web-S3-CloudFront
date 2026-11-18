import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive';
  className?: string;
}

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'outline' | 'destructive';

const variantVariants: Record<BadgeVariant, string> = {
  default: 'border-brand-100 bg-brand-50 text-brand-700',
  secondary: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  success: 'border-green-100 bg-green-50 text-green-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  outline: 'border-neutral-200 bg-transparent text-neutral-600',
  destructive: 'border-red-100 bg-red-50 text-red-700',
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps & { variant?: BadgeVariant }>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
          variantVariants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge };
