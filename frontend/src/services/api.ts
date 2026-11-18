/**
 * Contratos de servicio de la plataforma joja.click.
 *
 * IMPORTANTE (seguridad):
 * - Este archivo NO contiene credenciales de AWS (claves de acceso, secretos,
 *   tokens temporales ni sesiones).
 * - Toda la comunicación con AWS (S3, CloudFront, etc.) se hace a través de la
 *   API Gateway + Lambda (backend) que tiene su propio rol de IAM. El navegador
 *   nunca toca AWS directamente.
 *
 * Endpoints consumidos (implementados en terraform/modules/api):
 *   GET  {API_BASE_URL}/api/files?search&type&status&sortBy&sortDir&page&pageSize
 *   GET  {API_BASE_URL}/api/stats
 *   POST {API_BASE_URL}/api/upload/url   -> URL prefijada de S3 (PUT directo)
 *   POST {API_BASE_URL}/api/upload/complete -> notifica subida completada
 *
 * Endpoints pendientes de backend: getFile, deleteFile, activity, buckets, health.
 */

import type {
  FileItem,
  FilesQuery,
  FilesResponse,
  StorageStats,
  ActivityItem,
  BucketStatus,
  ServiceHealth,
  UploadService,
  FilesService,
  StatsService,
} from '@/types/index';

/* ------------------------------------------------------------------ */
/* Constantes de configuración (desde variables de entorno Vite)      */
/* ------------------------------------------------------------------ */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const ASSETS_BUCKET_PREFIX = import.meta.env.VITE_ASSETS_BUCKET_PREFIX ?? 'object-storage-prod-activos';
const SITE_DOMAIN = import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click';

/**
 * Cabeceras comunes para peticiones a la API real.
 * No incluir Authorization con credenciales de AWS; el backend (Lambda) gestiona
 * el acceso a S3 mediante su propio rol de IAM.
 */
export function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Site-Domain': SITE_DOMAIN,
  };
}

/**
 * Fetch con manejo de errores. Lanza si la respuesta no es OK.
 */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: apiHeaders(),
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Error ${res.status}`);
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* Implementación real de FilesService (consume la API)               */
/* ------------------------------------------------------------------ */

export const realFilesService: FilesService = {
  async listFiles(query: FilesQuery): Promise<FilesResponse> {
    const params = new URLSearchParams();
    if (query?.search) params.set('search', query.search);
    if (query?.type) params.set('type', query.type);
    if (query?.status) params.set('status', query.status);
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortDir) params.set('sortDir', query.sortDir);
    if (query?.page) params.set('page', String(query.page));
    if (query?.pageSize) params.set('pageSize', String(query.pageSize));

    const res = await apiFetch(`/api/files?${params.toString()}`);
    const data = await res.json();

    const items: FileItem[] = (data.items ?? []).map((it: any) => ({
      id: it.id ?? it.key,
      name: it.name,
      key: it.key,
      bucket: it.bucket ?? ASSETS_BUCKET_PREFIX,
      size: it.size ?? 0,
      type: it.type ?? 'application/octet-stream',
      lastModified: it.lastModified ?? new Date().toISOString(),
      status: it.status ?? 'available',
      etag: it.etag,
      url: it.signed_url ?? `https://${SITE_DOMAIN}/${it.key}`,
    }));

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 12;
    return {
      items,
      pagination: {
        page,
        pageSize,
        total: data.pagination?.total ?? items.length,
        totalPages: data.pagination?.totalPages ?? Math.ceil(items.length / pageSize),
      },
    };
  },

  async getFile(id): Promise<FileItem | null> {
    const { items } = await this.listFiles({
      page: 1,
      pageSize: 200,
      sortBy: 'name',
      sortDir: 'asc',
    });
    return items.find((f) => f.id === id) ?? null;
  },

  async deleteFile(_id: string): Promise<void> {
    throw new Error('Eliminación de archivos no disponible aún (falta endpoint DELETE en la API).');
  },
};

/* ------------------------------------------------------------------ */
/* Implementación real de StatsService (consume la API)               */
/* ------------------------------------------------------------------ */

export const realStatsService: StatsService = {
  async getStorageStats(): Promise<StorageStats> {
    const res = await apiFetch('/api/stats');
    const data = await res.json();
    return {
      totalFiles: data.totalFiles ?? 0,
      totalSizeBytes: data.totalSizeBytes ?? 0,
      usedSizeBytes: data.usedSizeBytes ?? 0,
      availableSizeBytes: data.availableSizeBytes ?? 0,
      filesByType: (data.filesByType ?? []).map((t: any) => ({
        type: t.type ?? 'Otros',
        count: t.count ?? 0,
        size: t.size ?? 0,
      })),
      recentUploads: data.recentUploads ?? 0,
      pendingUploads: data.pendingUploads ?? 0,
      failedUploads: data.failedUploads ?? 0,
    };
  },

  async getActivity(_limit = 10): Promise<ActivityItem[]> {
    return [];
  },

  async getBucketStatus(): Promise<BucketStatus[]> {
    return [];
  },

  async getServiceHealth(): Promise<ServiceHealth[]> {
    return [
      { name: 'API de archivos', status: 'operational', responseTime: 0 },
      { name: 'API Gateway', status: 'operational', responseTime: 0 },
    ];
  },
};

/* ------------------------------------------------------------------ */
/* Implementación real de UploadService (usa URLs prefijadas de S3)   */
/* ------------------------------------------------------------------ */

export const realUploadService: UploadService = {
  async requestUploadUrl(file: File): Promise<{ uploadUrl: string; objectKey: string }> {
    const res = await apiFetch('/api/upload/url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });
    const data = await res.json();
    return {
      uploadUrl: data.uploadUrl,
      objectKey: data.objectKey,
    };
  },

  async uploadFile(file: File, uploadUrl: string, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          onProgress?.(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Subida falló con status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Error de red al subir'));
      xhr.ontimeout = () => reject(new Error('Tiempo de espera agotado'));
      xhr.send(file);
    });
  },

  async notifyUploadCompleted(objectKey: string): Promise<void> {
    await apiFetch('/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ objectKey }),
    });
  },
};

/* ------------------------------------------------------------------ */
/* Selector de implementación activa                                  */
/* ------------------------------------------------------------------ */

export const filesService: FilesService = realFilesService;
export const uploadService: UploadService = realUploadService;
export const statsService: StatsService = realStatsService;

export { API_BASE_URL, ASSETS_BUCKET_PREFIX, SITE_DOMAIN };
