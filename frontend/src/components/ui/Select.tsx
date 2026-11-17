import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
