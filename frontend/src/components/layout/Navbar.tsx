import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  LayoutDashboard,
  FileText,
  Upload,
  ShieldCheck,
  Cloud,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/archivos', label: 'Archivos', icon: FileText },
  { href: '/subir', label: 'Subir archivos', icon: Upload },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex flex-col lg:flex-row">
          <div className="flex items-center justify-between px-4 py-3">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-brand-900 tracking-tight"
            >
              <div className="h-8 w-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                O
              </div>
              <span className="text-lg">joja.click</span>
            </Link>
            <div className="flex items-center gap-3">
              <ButtonMobile menuIcon={<Menu />} onClick={() => setOpen(true)} />
              <a
                href="https://console.aws.amazon.com/s3"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
              >
                <Cloud className="h-4 w-4" /> Consola AWS
              </a>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center gap-1 border-t lg:border-t-0 lg:border-l border-neutral-200 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        className={cn(
          'fixed inset-0 z-[60] lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full transition-transform duration-300',
        )}
      >
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-[61] w-full max-w-md bg-white border-r border-neutral-200 transform translate-x-full transition-transform duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2 font-bold text-brand-900 tracking-tight">
              <div className="h-7 w-7 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                O
              </div>
              <span className="text-base">joja.click</span>
            </div>
            <button className="p-2 text-neutral-500 hover:text-neutral-900" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 p-4 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Estado</p>
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
              <ShieldCheck className="h-4 w-4" /> Todos los servicios operativos
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ButtonMobile({ menuIcon, onClick }: { menuIcon: React.ReactNode; onClick: () => void }) {
  return (
    <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg" onClick={onClick}>
      {menuIcon}
    </button>
  );
}
