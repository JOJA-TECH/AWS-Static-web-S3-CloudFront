import { useState, useCallback } from 'react';
import type { UploadItem } from '@/types/index';
import { uploadService } from '@/services/api';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'md', 'csv', 'json', 'zip', 'mp4', 'mov', 'mp3',
];

export function useUpload() {
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return `Extensión no permitida: ${ext ?? 'desconocida'}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo demasiado grande (máx. ${formatBytes(MAX_FILE_SIZE)})`;
    }
    return null;
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newItems: UploadItem[] = fileArray.map((file) => {
      const validationError = validateFile(file);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: validationError ? 'error' : 'pending',
        progress: 0,
        error: validationError ?? undefined,
        size: file.size,
        type: file.type,
        createdAt: new Date().toISOString(),
      };
    });

    setQueue((prev) => [...prev, ...newItems]);

    // Procesar los archivos válidos
    newItems.forEach((item) => {
      if (item.status === 'error') return;
      processUpload(item);
    });
  }, [validateFile]);

  const processUpload = useCallback(async (item: UploadItem) => {
    try {
      setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 5 } : i)));

      const { uploadUrl, objectKey } = await uploadService.requestUploadUrl(item.file);

      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, uploadUrl, objectKey, progress: 10 } : i)),
      );

      await uploadService.uploadFile(item.file, uploadUrl!, (progress) => {
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress } : i)),
        );
      });

      await uploadService.notifyUploadCompleted(objectKey!);

      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'completed', progress: 100 } : i)),
      );
    } catch (err) {
      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: err instanceof Error ? err.message : 'Error al subir' } : i,
        ),
      );
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    }
  }, []);

  const retry = useCallback((id: string) => {
    const item = queue.find((i) => i.id === id);
    if (!item || item.status !== 'error') return;
    setQueue((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'pending', progress: 0, error: undefined } : i)));
    processUpload(item);
  }, [queue, processUpload]);

  const cancel = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'cancelled' } : i)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed' && i.status !== 'cancelled'));
  }, []);

  const stats = {
    total: queue.length,
    pending: queue.filter((i) => i.status === 'pending').length,
    uploading: queue.filter((i) => i.status === 'uploading').length,
    completed: queue.filter((i) => i.status === 'completed').length,
    error: queue.filter((i) => i.status === 'error').length,
    cancelled: queue.filter((i) => i.status === 'cancelled').length,
  };

  return {
    queue,
    error,
    setError,
    addFiles,
    retry,
    cancel,
    remove,
    clearCompleted,
    stats,
    isActive: queue.some((i) => i.status === 'pending' || i.status === 'uploading'),
  };
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
