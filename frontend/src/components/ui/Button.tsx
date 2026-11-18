import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:pointer-events-none disabled:opacity-50 select-none',
          {
            default: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
            destructive: 'bg-red-600 text-white hover:bg-red-700',
            outline: 'border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-900',
            secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
            ghost: 'hover:bg-neutral-100 hover:text-neutral-900',
            link: 'text-brand-600 underline-offset-4 hover:underline',
          }[variant],
          {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-2xl px-8',
            icon: 'h-10 w-10',
          }[size],
        )}
        {...rest}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
