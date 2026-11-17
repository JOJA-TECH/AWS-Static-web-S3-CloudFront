import { X, RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatBytes } from '@/lib/utils';
import { ProgressBar } from './ProgressBar';
import type { UploadItem, FileStatus } from '@/types/index';

interface UploadItemProps {
  item: UploadItem;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}

export function UploadItem({ item, onRetry, onCancel, onRemove }: UploadItemProps) {
  const statusLabel: Record<FileStatus, string> = {
    pending: 'Pendiente',
    uploading: 'Subiendo',
    completed: 'Completado',
    error: 'Error',
    cancelled: 'Cancelado',
  };

  const statusVariant: Record<FileStatus, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
    pending: 'default',
    uploading: 'default',
    completed: 'success',
    error: 'outline',
    cancelled: 'outline',
  };

  const statusIcon: Record<FileStatus, React.ElementType> = {
    pending: Clock,
    uploading: Clock,
    completed: CheckCircle2,
    error: AlertCircle,
    cancelled: X,
  };

  const StatusIcon = statusIcon[item.status];

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 p-1.5 rounded-lg bg-neutral-100 text-neutral-500">
          <StatusIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-medium text-neutral-900 truncate">{item.file.name}</div>
            <span className="text-[11px] text-neutral-500 font-mono">{formatBytes(item.size)}</span>
          </div>
          <div className="text-[11px] text-neutral-500">{item.type}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={statusVariant[item.status]} className="text-[10px] whitespace-nowrap">
          {statusLabel[item.status]}
        </Badge>
        {(item.status === 'uploading' || item.status === 'pending') && (
          <div className="w-24">
            <ProgressBar progress={item.progress} status={item.status} />
            <div className="text-[10px] text-neutral-500 text-right mt-0.5">{item.progress}%</div>
          </div>
        )}
        {item.status === 'error' && (
          <Button variant="ghost" size="icon" onClick={() => onRetry(item.id)} title="Reintentar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {item.status !== 'completed' && item.status !== 'error' && (
          <Button variant="ghost" size="icon" onClick={() => onCancel(item.id)} title="Cancelar">
            <X className="h-4 w-4 text-neutral-500" />
          </Button>
        )}
        {item.status !== 'uploading' && (
          <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} title="Eliminar de la lista">
            <Trash2 className="h-4 w-4 text-neutral-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
