import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  HardDrive,
  Upload,
  Activity,
  CircleAlert,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatBytes, relativeDate } from '@/lib/utils';
import { statsService } from '@/services/api';
import type { StorageStats, ActivityItem, BucketStatus, ServiceHealth } from '@/types/index';

export default function Dashboard() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [buckets, setBuckets] = useState<BucketStatus[]>([]);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, b, h] = await Promise.all([
        statsService.getStorageStats(),
        statsService.getActivity(6),
        statsService.getBucketStatus(),
        statsService.getServiceHealth(),
      ]);
      setStats(s);
      setActivity(a);
      setBuckets(b);
      setHealth(h);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
  }, [load]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Panel de control</h1>
          <Link to="/subir" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
            Subir archivo <Upload className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
        {error} <button onClick={load} className="ml-2 underline text-brand-600">Reintentar</button>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-6 text-center text-neutral-500">Cargando panel...</div>;
  }

  const domain = import.meta.env.VITE_SITE_DOMAIN ?? 'joja.click';
  const usedPct = stats.totalSizeBytes
    ? Math.round((stats.usedSizeBytes / stats.totalSizeBytes) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Panel de control</h1>
          <p className="text-neutral-500 text-sm">
            Resumen de almacenamiento en {domain}
          </p>
        </div>
        <Link to="/subir" className="inline-flex items-center gap-2">
          <Button>Subir archivo</Button>
        </Link>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de archivos"
          value={stats.totalFiles}
          subtitle="objetos almacenados"
          icon={<FileText className="h-5 w-5" />}
          trend={{ label: '+2 esta semana', positive: true }}
        />
        <StatCard
          title="Espacio utilizado"
          value={formatBytes(stats.usedSizeBytes)}
          subtitle={`de ${formatBytes(stats.totalSizeBytes)}`}
          icon={<HardDrive className="h-5 w-5" />}
          trend={{ label: `${usedPct} % de uso`, positive: usedPct < 80 }}
        />
        <StatCard
          title="Cargas exitosas"
          value={stats.recentUploads}
          subtitle="últimas 24 h"
          icon={<Upload className="h-5 w-5" />}
          trend={{ label: '+5 %', positive: true }}
        />
        <StatCard
          title="Pendientes / fallidas"
          value={stats.pendingUploads + stats.failedUploads}
          subtitle="requieren atención"
          icon={<CircleAlert className="h-5 w-5" />}
          trend={{
            label: stats.failedUploads > 0 ? 'Revisar cola' : 'Sin incidencias',
            positive: stats.failedUploads === 0,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfica de uso de almacenamiento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Uso de almacenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <StorageChart used={stats.usedSizeBytes} total={stats.totalSizeBytes} />
          </CardContent>
          <CardFooter className="gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-brand-600" />
              <span className="text-neutral-600">Utilizado</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-neutral-200" />
              <span className="text-neutral-600">Disponible</span>
            </div>
          </CardFooter>
        </Card>

        {/* Distribución por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.filesByType.map((t) => {
                const pct = stats.totalSizeBytes ? Math.round((t.size / stats.totalSizeBytes) * 100) : 0;
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-[11px] font-medium text-neutral-700">{t.type}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full bg-brand-600 transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[11px] font-mono text-neutral-600 whitespace-nowrap">
                      {formatBytes(t.size)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Estado de los buckets */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg">Estado de los buckets</CardTitle>
          </CardHeader>
          <CardContent>
            {buckets.length === 0 ? (
              <p className="text-sm text-neutral-500">Sin datos de buckets disponibles.</p>
            ) : (
            <div className="space-y-3">
              {buckets.map((b) => (
                <div key={b.name} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{b.name}</div>
                    <div className="text-xs text-neutral-500">
                      {b.objects} objetos · {formatBytes(b.size)}
                    </div>
                  </div>
                  <Badge
                    variant={
                      b.status === 'healthy'
                        ? 'success'
                        : b.status === 'degraded'
                          ? 'warning'
                          : 'outline'
                    }
                  >
                    {b.status === 'healthy'
                      ? 'Operativo'
                      : b.status === 'degraded'
                        ? 'Degradado'
                        : 'Fuera de servicio'}
                  </Badge>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Salud de los servicios */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg">Estado de los servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="text-sm font-medium text-neutral-900">{s.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        s.status === 'operational'
                          ? 'success'
                          : s.status === 'degraded'
                            ? 'warning'
                            : 'outline'
                      }
                      className="text-[10px] px-2 py-1"
                    >
                      {s.status === 'operational'
                        ? 'Operativo'
                        : s.status === 'degraded'
                          ? 'Degradado'
                          : 'Fuera'}
                    </Badge>
                    {s.responseTime && (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {s.responseTime} ms
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Actividad reciente</CardTitle>
            <Link to="/archivos" className="text-sm text-brand-600 hover:underline">
              Ver todo
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="Sin actividad reciente"
              description="Las cargas, descargas y eliminaciones aparecerán aquí."
            />
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-900">
                        {item.action === 'upload'
                          ? 'Subida'
                          : item.action === 'download'
                            ? 'Descarga'
                            : 'Eliminación'} de archivo
                      </div>
                      <div className="text-xs text-neutral-500 font-mono">{item.fileName}</div>
                      <div className="text-xs text-neutral-400">{relativeDate(item.timestamp)}</div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === 'success'
                        ? 'success'
                        : item.status === 'warning'
                          ? 'warning'
                          : 'destructive'
                    }
                    className="text-[10px] px-2 py-1"
                  >
                    {item.status === 'success'
                      ? 'Éxito'
                      : item.status === 'warning'
                        ? 'Advertencia'
                        : 'Error'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StorageChart({ used, total }: { used: number; total: number }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="space-y-2 py-1" role="img" aria-label="Uso de almacenamiento">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-semibold text-neutral-900">
          {formatBytes(used)} ({pct.toFixed(0)}%)
        </span>
        <span className="text-neutral-500">de {formatBytes(total)}</span>
      </div>
      <div className="h-7 rounded-lg bg-neutral-200 overflow-hidden">
        <div
          className="h-full bg-brand-600 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between gap-2 text-[11px] text-neutral-400">
        <span>0 B</span>
        <span>{formatBytes(total / 2)}</span>
        <span>{formatBytes(total)}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="h-3 w-3/4 bg-neutral-200 rounded animate-pulse" />
        <div className="h-8 w-full bg-neutral-200 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-neutral-200 rounded animate-pulse" />
      </div>
    </Card>
  );
}
