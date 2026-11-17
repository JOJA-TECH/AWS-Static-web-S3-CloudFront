import { Search, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { FileRow } from './FileRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFiles } from '@/hooks/useFiles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function FileTable() {
  const {
    query,
    items,
    pagination,
    loading,
    error,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setSort,
    setPage,
    refresh,
  } = useFiles();

  const types = ['image/', 'application/pdf', 'text/', 'video/', 'application/'];
  const statuses = ['available', 'processing', 'archived'];

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="h-10 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
        {error} <button onClick={refresh} className="ml-2 underline text-brand-600">Reintentar</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title="No se encontraron archivos"
        description="Prueba con otro término de búsqueda o ajusta los filtros."
        action={
          <Button variant="outline" onClick={refresh} className="mt-4">
            Limpiar filtros
          </Button>
        }
      />
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 p-4 border-b border-neutral-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Input
            value={query.search ?? ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar archivos..."
          />
        </div>
        <div className="flex items-center gap-2">
          <SelectFilter
            label="Tipo"
            value={query.type ?? ''}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[{ label: 'Todos', value: '' }, ...types.map((t) => ({ label: t, value: t }))]}
          />
          <SelectFilter
            label="Estado"
            value={query.status ?? ''}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[{ label: 'Todos', value: '' }, ...statuses.map((s) => ({ label: s, value: s }))]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSort(query.sortBy, query.sortDir === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5"
          >
            <ChevronUp className="h-4 w-4" /> <ChevronDown className="h-4 w-4" />
          </Button>
          <Button onClick={refresh} className="h-10 w-10" title="Actualizar">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Nombre / Ruta</th>
              <th style={{ width: '12%' }}>Tipo</th>
              <th style={{ width: '12%' }} className="text-right">Tamaño</th>
              <th style={{ width: '16%' }}>Modificado</th>
              <th style={{ width: '14%' }}>Bucket</th>
              <th style={{ width: '16%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-neutral-600">
        <p>
          Mostrando <b>{(pagination.page - 1) * pagination.pageSize + 1}</b> a{' '}
          <b>{Math.min(pagination.page * pagination.pageSize, pagination.total)}</b> de{' '}
          <b>{pagination.total}</b> archivos
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            Anterior
          </Button>
          <span className="mx-2">Página {pagination.page} de {pagination.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SelectFilterProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ label: string; value: string }>;
}

function SelectFilter({ label, value, onChange, options }: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-neutral-500 uppercase">{label}</span>
      <select
        className="h-9 rounded-xl border border-neutral-200 bg-white px-2 text-xs focus:ring-2 focus:ring-brand-500 outline-none"
        value={value}
        onChange={onChange}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
