import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Cloud,
  Database,
  HardDrive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/', label: 'Panel de control', icon: LayoutDashboard },
  { href: '/archivos', label: 'Explorador de archivos', icon: FileText },
  { href: '/subir', label: 'Cargar archivos', icon: Upload },
];

const secondaryItems = [
  { href: '#', label: 'Bucket: Activos', icon: HardDrive },
  { href: '#', label: 'Bucket: Cargas', icon: Database },
  { href: '#', label: 'Bucket: Logs', icon: Cloud },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-neutral-200 flex-shrink-0">
      <div className="flex flex-col h-full">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2 font-bold text-brand-900 tracking-tight text-lg">
            <div className="h-8 w-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
              O
            </div>
            <span>joja.click</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Plataforma de almacenamiento</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Navegación
          </p>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav className="p-4 border-t border-neutral-100 space-y-1">
          <p className="px-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Almacenamiento
          </p>
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                href="#"
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition"
              >
                <Icon className="h-5 w-5 shrink-0 text-neutral-400" />
                {item.label}
                <span className="ml-auto text-xs font-medium text-neutral-400 bg-neutral-100 rounded-full px-2 py-0.5">
                  —
                </span>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-neutral-100">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Estado de servicios</p>
        <div className="space-y-2">
          {[
            { name: 'S3 (activos)', status: 'operational' },
            { name: 'CloudFront CDN', status: 'operational' },
            { name: 'API de archivos', status: 'operational' },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="text-neutral-600">{s.name}</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border">
                {s.status === 'operational' ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Operativo
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Incidente
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
