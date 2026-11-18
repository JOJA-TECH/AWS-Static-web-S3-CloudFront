import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { FileTable } from '@/components/file/FileTable';
import { ViewToggle } from '@/components/file/ViewToggle';
import { Button } from '@/components/ui/Button';
import { CardContent } from '@/components/ui/Card';

export default function FileExplorer() {
  const [view, setView] = useState<'list' | 'grid'>('list');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Explorador de archivos</h1>
          <p className="text-neutral-500 text-sm">
            Consulta, filtra y gestiona los objetos almacenados en el bucket de activos.
          </p>
        </div>
        <Link to="/subir" className="inline-flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Subir archivo
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <ViewToggle active={view} onChange={setView} />
        </div>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-neutral-100">
            <div className="lg:col-span-3 border-l border-neutral-100">
              <FileTable />
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
