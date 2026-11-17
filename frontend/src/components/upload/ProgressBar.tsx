import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  status: string;
  className?: string;
}

export function ProgressBar({ progress, status, className }: ProgressBarProps) {
  const colorByStatus = {
    pending: 'bg-neutral-200',
    uploading: 'bg-brand-500',
    completed: 'bg-green-500',
    error: 'bg-red-500',
    cancelled: 'bg-neutral-400',
  } as Record<string, string>;

  return (
    <div className={cn('w-full h-2 rounded-full bg-neutral-200 overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all duration-500', colorByStatus[status] ?? 'bg-neutral-200')}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
