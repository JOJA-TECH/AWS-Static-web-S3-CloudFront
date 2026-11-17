/**
 * Datos simulados (mock) usados por la capa de servicios mientras no existe
 * una API real. Separado para que sea fácil de eliminar o reemplazar.
 *
 * Los datos NO son reales y NO se persisten. Al recargar la página se
 * regeneran desde este módulo.
 */

import type { FileItem, ActivityItem, BucketStatus, ServiceHealth } from '@/types/index';
import { ASSETS_BUCKET_PREFIX } from './api';

export const MOCK_FILES: FileItem[] = [
  {
    id: 'f1',
    name: 'presentacion-trimestral.pdf',
    key: 'documentos/presentacion-trimestral.pdf',
    bucket: ASSETS_BUCKET_PREFIX,
    size: 2_457_600,
    type: 'application/pdf',
    lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'available',
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/documentos/presentacion-trimestral.pdf`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/imagenes/logo-marca.svg`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/galeria/foto-evento-01.jpg`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/backups/backup-base-datos.sql`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/documentos/manual-usuario.md`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/reportes/reporte-finanzas.xlsx`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/multimedia/video-demo.mp4`,
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
    url: `https://${import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click'}/configuracion/config-app.json`,
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
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

export const MOCK_BUCKETS: BucketStatus[] = [
  { name: 'object-storage-prod-activos', status: 'healthy', objects: 1240, size: 48_230_720 },
  { name: 'object-storage-prod-cargas', status: 'healthy', objects: 86, size: 2_147_483_648 },
  { name: 'object-storage-prod-logs', status: 'healthy', objects: 3_210, size: 1_073_741_824 },
];

export const MOCK_HEALTH: ServiceHealth[] = [
  { name: 'S3 (activos)', status: 'operational', responseTime: 42 },
  { name: 'CloudFront CDN', status: 'operational', responseTime: 18 },
  { name: 'API de archivos', status: 'operational', responseTime: 65 },
  { name: 'Lambda@Edge (headers)', status: 'operational', responseTime: 12 },
];
