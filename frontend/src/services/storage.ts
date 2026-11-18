/**
 * Adaptador de almacenamiento temporal.
 *
 * Este módulo encapsula el acceso a los buckets de S3. Actualmente delega en
 * los servicios mock. Cuando exista el backend, aquí se implementan las
 * llamadas a los endpoints reales (URLs prefirmadas, multipart, etc.).
 *
 * Reglas de seguridad:
 * - Nunca incluir AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY ni AWS_SESSION_TOKEN.
 * - Nunca instanciar @aws-sdk/client-s3 con credenciales en el navegador.
 * - Las operaciones de escritura (subida) pasan por una URL prefirmada del backend.
 */

import type { FileItem, FilesQuery, FilesResponse } from '@/types/index';
import { filesService } from './api';

export const storage = {
  listFiles: (query?: FilesQuery): Promise<FilesResponse> => filesService.listFiles(query),
  getFile: (id: string): Promise<FileItem | null> => filesService.getFile(id),
  deleteFile: (id: string): Promise<void> => filesService.deleteFile(id),
};
