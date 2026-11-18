export type FileStatus = 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';

export interface FileItem {
  id: string;
  name: string;
  key: string;
  bucket: string;
  size: number;
  type: string;
  lastModified: string;
  etag?: string;
  status: 'available' | 'processing' | 'archived';
  url?: string;
}

export interface UploadItem {
  id: string;
  file: File;
  uploadUrl?: string;
  objectKey?: string;
  status: FileStatus;
  progress: number;
  error?: string;
  size: number;
  type: string;
  createdAt: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSizeBytes: number;
  usedSizeBytes: number;
  availableSizeBytes: number;
  filesByType: Array<{ type: string; count: number; size: number }>;
  recentUploads: number;
  pendingUploads: number;
  failedUploads: number;
}

export interface ActivityItem {
  id: string;
  action: 'upload' | 'download' | 'delete' | 'move';
  fileName: string;
  user: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface BucketStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  objects: number;
  size: number;
}

export interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime?: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FilesQuery {
  search?: string;
  type?: string;
  status?: string;
  sortBy: 'name' | 'size' | 'lastModified';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface FilesResponse {
  items: FileItem[];
  pagination: Pagination;
}

export interface UploadService {
  requestUploadUrl(file: File): Promise<{ uploadUrl: string; objectKey: string }>;
  uploadFile(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void,
  ): Promise<void>;
  notifyUploadCompleted(objectKey: string): Promise<void>;
}

export interface FilesService {
  listFiles(query?: FilesQuery): Promise<FilesResponse>;
  getFile(id: string): Promise<FileItem | null>;
  deleteFile(id: string): Promise<void>;
}

export interface StatsService {
  getStorageStats(): Promise<StorageStats>;
  getActivity(limit?: number): Promise<ActivityItem[]>;
  getBucketStatus(): Promise<BucketStatus[]>;
  getServiceHealth(): Promise<ServiceHealth[]>;
}
