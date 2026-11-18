import { Trash2 } from 'lucide-react';
import type { useUpload } from '@/hooks/useUpload';
import { UploadItem } from './UploadItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

type Props = ReturnType<typeof useUpload>;

export function UploadQueue({ queue, retry, cancel, remove, clearCompleted, stats, error }: Props) {

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<Trash2 className="h-8 w-8" />}
        title="Lista de cargas vacía"
        description="Arrastra archivos o haz clic en 'Seleccionar archivos' para comenzar la carga."
        action={
          <Button variant="outline" disabled>
            Seleccionar archivos
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
        <div className="text-sm text-neutral-600">
          {stats.completed} completadas
          {stats.error ? ` · ${stats.error} con error` : ''}
          {stats.uploading ? ` · ${stats.uploading} subiendo` : ''}
        </div>
        {(stats.completed > 0 || stats.cancelled > 0) && (
          <Button variant="outline" size="sm" onClick={clearCompleted}>
            Limpiar completadas
          </Button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto pr-2">
        {queue.map((item) => (
          <UploadItem
            key={item.id}
            item={item}
            onRetry={retry}
            onCancel={cancel}
            onRemove={remove}
          />
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
