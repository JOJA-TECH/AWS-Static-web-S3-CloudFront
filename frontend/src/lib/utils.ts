import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { FileItem } from '@/types/index';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} h`;
  if (diffDay < 7) return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
  return formatDate(iso);
}

export function getFileIcon(type: string, name: string): string {
  if (type.startsWith('image/')) return 'image';
  if (type.includes('pdf')) return 'file-text';
  if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'file';
  if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'file';
  if (type.includes('zip') || type.includes('compressed') || name.endsWith('.zip')) return 'file-zip';
  if (type.includes('json')) return 'code';
  if (type.includes('text') || name.endsWith('.md') || name.endsWith('.txt')) return 'file-text';
  if (type.includes('video')) return 'film';
  if (type.includes('audio')) return 'music';
  return 'file';
}

export function getStatusColor(status: FileItem['status']): string {
  switch (status) {
    case 'available': return 'text-green-600 bg-green-50 border-green-100';
    case 'processing': return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'archived': return 'text-neutral-500 bg-neutral-50 border-neutral-100';
    default: return 'text-neutral-500 bg-neutral-50 border-neutral-100';
  }
}
