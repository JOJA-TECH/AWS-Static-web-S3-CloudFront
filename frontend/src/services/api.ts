/**
 * Contratos de servicio de la plataforma joja.click.
 *
 * IMPORTANTE (seguridad):
 * - Este archivo NO contiene credenciales de AWS (claves de acceso, secretos,
 *   tokens temporales ni sesiones).
 * - Toda la comunicación con AWS (S3, CloudFront, etc.) debe hacerse a través
 *   de una API autorizada (backend) que genere URLs prefirmadas o gestione las
 *   operaciones en nombre del usuario.
 * - Mientras no exista la API real, se usa un adaptador MOCK claramente
 *   separado. Los datos son simulados y no se persisten.
 *
 * Cuando se disponga del backend, implementar estas mismas interfaces
 * llamando a los endpoints reales y eliminar la carpeta services/mock.
 */

import type {
  FileItem,
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
 * No incluir Authorization con credenciales de AWS; el backend gestiona la
 * autenticación (por ejemplo, cookie de sesión, OAuth2, JWT o IAM role).
 */
export function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Site-Domain': SITE_DOMAIN,
  };
}

/* ------------------------------------------------------------------ */
/* Servicios MOCK (temporal, reemplazar por API real)                 */
/* ------------------------------------------------------------------ */

const MOCK_FILES: FileItem[] = [
  {
    id: 'f1',
    name: 'presentacion-trimestral.pdf',
    key: 'documentos/presentacion-trimestral.pdf',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 2_457_600,
    type: 'application/pdf',
    lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'available',
    url: `https://${SITE_DOMAIN}/documentos/presentacion-trimestral.pdf`,
  },
  {
    id: 'f2',
    name: 'logo-marca.svg',
    key: 'imagenes/logo-marca.svg',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 45_210,
    type: 'image/svg+xml',
    lastModified: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'available',
    url: `https://${SITE_DOMAIN}/imagenes/logo-marca.svg`,
  },
  {
    id: 'f3',
    name: 'foto-evento-01.jpg',
    key: 'galeria/foto-evento-01.jpg',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 3_145_728,
    type: 'image/jpeg',
    lastModified: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'available',
    url: `https://${SITE_DOMAIN}/galeria/foto-evento-01.jpg`,
  },
  {
    id: 'f4',
    name: 'backup-base-datos.sql',
    key: 'backups/backup-base-datos.sql',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 12_582_912,
    type: 'application/sql',
    lastModified: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: 'processing',
    url: `https://${SITE_DOMAIN}/backups/backup-base-datos.sql`,
  },
  {
    id: 'f5',
    name: 'manual-usuario.md',
    key: 'documentos/manual-usuario.md',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 87_340,
    type: 'text/markdown',
    lastModified: new Date(Date.now() - 86400000 * 15).toISOString(),
    status: 'available',
    url: `https://${SITE_DOMAIN}/documentos/manual-usuario.md`,
  },
  {
    id: 'f6',
    name: 'reporte-finanzas.xlsx',
    key: 'reportes/reporte-finanzas.xlsx',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 1_048_576,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    lastModified: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'available',
    url: `https://${SITE_DOMAIN}/reportes/reporte-finanzas.xlsx`,
  },
  {
    id: 'f7',
    name: 'video-demo.mp4',
    key: 'multimedia/video-demo.mp4',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 45_056_000,
    type: 'video/mp4',
    lastModified: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'archived',
    url: `https://${SITE_DOMAIN}/multimedia/video-demo.mp4`,
  },
  {
    id: 'f8',
    name: 'config-app.json',
    key: 'configuracion/config-app.json',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 2_048,
    type: 'application/json',
    lastModified: new Date(Date.now() - 86400000 * 20).toISOString(),
    status: 'available',
    url: `https://${SITE_DOMAIN}/configuracion/config-app.json`,
  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    action: 'upload',
    fileName: 'foto-evento-01.jpg',
    user: 'ana.garcia@joja.click',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'success',
  },
  {
    id: 'a2',
    action: 'download',
    fileName: 'presentacion-trimestral.pdf',
    user: 'carlos.ruiz@joja.click',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'success',
  },
  {
    id: 'a3',
    action: 'upload',
    fileName: 'backup-base-datos.sql',
    user: 'sistema@joja.click',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    status: 'warning',
  },
  {
    id: 'a4',
    action: 'delete',
    fileName: 'borrador-antiguo.docx',
    user: 'ana.garcia@joja.click',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'success',
  },
  {
    id: 'a5',
    action: 'upload',
    fileName: 'reporte-finanzas.xlsx',
    user: 'carlos.ruiz@joja.click',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'success',
  },
];

const MOCK_BUCKETS: BucketStatus[] = [
  { name: 'object-storage-prod-activos', status: 'healthy', objects: 1240, size: 48_230_720 },
  { name: 'object-storage-prod-cargas', status: 'healthy', objects: 86, size: 2_147_483_648 },
  { name: 'object-storage-prod-logs', status: 'healthy', objects: 3_210, size: 1_073_741_824 },
];

const MOCK_HEALTH: ServiceHealth[] = [
  { name: 'S3 (activos)', status: 'operational', responseTime: 42 },
  { name: 'CloudFront CDN', status: 'operational', responseTime: 18 },
  { name: 'API de archivos', status: 'operational', responseTime: 65 },
  { name: 'Lambda@Edge (headers)', status: 'operational', responseTime: 12 },
];

/* ------------------------------------------------------------------ */
/* Implementación mock de FilesService                                */
/* ------------------------------------------------------------------ */

export const mockFilesService: FilesService = {
  async listFiles(query): Promise<FilesResponse> {
    await new Promise((r) => setTimeout(r, 300)); // simula latencia de red

    let items = [...MOCK_FILES];

    if (query?.search) {
      const term = query.search.toLowerCase();
      items = items.filter((f) => f.name.toLowerCase().includes(term));
    }
    if (query?.type) {
      items = items.filter((f) => f.type.includes(query.type!));
    }
    if (query?.status) {
      items = items.filter((f) => f.status === query.status);
    }

    const { sortBy, sortDir } = query ?? { sortBy: 'name', sortDir: 'asc' };
    items.sort((a, b) => {
      const va = a[sortBy as keyof FileItem];
      const vb = b[sortBy as keyof FileItem];
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;

    return {
      items: items.slice(start, start + pageSize),
      pagination: { page, pageSize, total, totalPages },
    };
  },

  async getFile(id): Promise<FileItem | null> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_FILES.find((f) => f.id === id) ?? null;
  },

  async deleteFile(id): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_FILES.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Archivo no encontrado');
    MOCK_FILES.splice(idx, 1);
  },
};

/* ------------------------------------------------------------------ */
/* Implementación mock de StatsService                                */
/* ------------------------------------------------------------------ */

export const mockStatsService: StatsService = {
  async getStorageStats(): Promise<StorageStats> {
    await new Promise((r) => setTimeout(r, 400));
    const totalFiles = MOCK_FILES.length;
    const totalSizeBytes = MOCK_FILES.reduce((acc, f) => acc + f.size, 0);
    const usedSizeBytes = Math.floor(totalSizeBytes * 0.34);
    return {
      totalFiles,
      totalSizeBytes,
      usedSizeBytes,
      availableSizeBytes: totalSizeBytes - usedSizeBytes,
      filesByType: [
        { type: 'Imágenes', count: 3, size: 8_250_438 },
        { type: 'Documentos', count: 4, size: 3_630_448 },
        { type: 'Multimedia', count: 1, size: 45_056_000 },
        { type: 'Configuración', count: 1, size: 2_048 },
        { type: 'Backups', count: 1, size: 12_582_912 },
      ],
      recentUploads: 2,
      pendingUploads: 1,
      failedUploads: 0,
    };
  },

  async getActivity(limit = 10): Promise<ActivityItem[]> {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_ACTIVITY.slice(0, limit);
  },

  async getBucketStatus(): Promise<BucketStatus[]> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_BUCKETS;
  },

  async getServiceHealth(): Promise<ServiceHealth[]> {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_HEALTH;
  },
};

/* ------------------------------------------------------------------ */
/* Implementación mock de UploadService                               */
/* ------------------------------------------------------------------ */

export const mockUploadService: UploadService = {
  async requestUploadUrl(file: File): Promise<{ uploadUrl: string; objectKey: string }> {
    await new Promise((r) => setTimeout(r, 400));
    // En producción: llamar a POST /api/upload/url para obtener una URL
    // prefirmada del bucket de cargas (S3) con vencimiento corto.
    const objectKey = `cargas/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    return {
      uploadUrl: `${API_BASE_URL}/upload/url?objectKey=${encodeURIComponent(objectKey)}`,
      objectKey,
    };
  },

  async uploadFile(_file, _uploadUrl, onProgress): Promise<void> {
    // En producción: PUT file a uploadUrl (URL prefirmada de S3) con
    // XMLHttpRequest / fetch para leer progreso.
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          onProgress?.(100);
          resolve();
        } else {
          onProgress?.(progress);
        }
      }, 200);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Tiempo de espera agotado'));
      }, 15000);
    });
  },

  async notifyUploadCompleted(_objectKey: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 300));
    // En producción: POST /api/upload/complete para que el backend registre
    // el objeto y invalide caché de CloudFront si aplica.
  },
};

/* ------------------------------------------------------------------ */
/* Selector de implementación activa                                  */
/* ------------------------------------------------------------------ */

/**
 * Cambia aquí a la implementación real cuando exista el backend.
 * Ejemplo:
 *   export const filesService = realFilesService;
 *   export const uploadService = realUploadService;
 *   export const statsService = realStatsService;
 */
export const filesService: FilesService = mockFilesService;
export const uploadService: UploadService = mockUploadService;
export const statsService: StatsService = mockStatsService;

export { API_BASE_URL, ASSETS_BUCKET_PREFIX, SITE_DOMAIN };

/**
 * Nota de migración a API real:
 *
 * 1. Crear backend (API REST o GraphQL) con autenticación autorizada.
 * 2. Endpoints sugeridos:
 *    - GET    /api/files          -> listar archivos (query: search, type, status, sort, page, pageSize)
 *    - GET    /api/files/:id      -> detalle de un archivo
 *    - DELETE /api/files/:id      -> eliminar archivo
 *    - POST   /api/upload/url     -> devuelve URL prefirmada de S3 + objectKey
 *    - POST   /api/upload/complete-> notifica subida completada
 *    - GET    /api/stats          -> estadísticas de almacenamiento
 *    - GET    /api/activity       -> actividad reciente
 *    - GET    /api/buckets        -> estado de buckets
 *    - GET    /api/health         -> salud de servicios
 * 3. Sustituir mockFilesService, mockUploadService y mockStatsService por
 *    implementaciones que llamen a estos endpoints con fetch.
 * 4. Nunca exponer AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY al navegador.
 */
