import { useState, useCallback, useEffect } from 'react';
import type { FilesQuery, FilesResponse } from '@/types/index';
import { storage } from '@/services/storage';

const DEFAULT_QUERY: FilesQuery = {
  search: '',
  type: '',
  status: '',
  sortBy: 'lastModified',
  sortDir: 'desc',
  page: 1,
  pageSize: 12,
};

export function useFiles(initialQuery?: Partial<FilesQuery>) {
  const [query, setQuery] = useState<FilesQuery>({ ...DEFAULT_QUERY, ...initialQuery });
  const [data, setData] = useState<FilesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await storage.listFiles(query);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar archivos');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const setSearch = useCallback((value: string) => {
    setQuery((prev) => ({ ...prev, search: value, page: 1 }));
  }, []);

  const setTypeFilter = useCallback((value: string) => {
    setQuery((prev) => ({ ...prev, type: value, page: 1 }));
  }, []);

  const setStatusFilter = useCallback((value: string) => {
    setQuery((prev) => ({ ...prev, status: value, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: FilesQuery['sortBy'], sortDir: FilesQuery['sortDir']) => {
    setQuery((prev) => ({ ...prev, sortBy, sortDir, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  }, []);

  const deleteFile = useCallback(async (id: string) => {
    try {
      await storage.deleteFile(id);
      setData((d) => {
        if (!d) return d;
        return {
          ...d,
          items: d.items.filter((f) => f.id !== id),
          pagination: { ...d.pagination, total: Math.max(0, d.pagination.total - 1) },
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar archivo');
    }
  }, []);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return {
    query,
    setQuery,
    data,
    items: data?.items ?? [],
    pagination: data?.pagination ?? { page: 1, pageSize: 12, total: 0, totalPages: 0 },
    loading,
    error,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setSort,
    setPage,
    deleteFile,
    refresh,
    getFile: storage.getFile,
  };
}
