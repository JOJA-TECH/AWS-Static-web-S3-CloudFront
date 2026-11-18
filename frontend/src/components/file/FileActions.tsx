import { useState } from 'react';
import { Download, ExternalLink, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useFiles } from '@/hooks/useFiles';

interface FileActionsProps {
  file: { id: string; name: string; status: string; url?: string };
}

export function FileActions({ file }: FileActionsProps) {
  const { deleteFile, error } = useFiles();
  const [open, setOpen] = useState(false);

  const handleDownload = () => {
    if (file.url) window.open(file.url, '_blank');
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Eliminar "${file.name}"?`)) {
      await deleteFile(file.id);
    }
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case 'available': return 'success';
      case 'processing': return 'warning';
      case 'archived': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Badge variant={statusVariant(file.status)} className="whitespace-nowrap">
        {file.status === 'available' ? 'Disponible' : file.status === 'processing' ? 'Procesando' : 'Archivado'}
      </Badge>
      <Button variant="ghost" size="icon" onClick={handleDownload} title="Descargar / Abrir">
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleDelete} title="Eliminar">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title="Más opciones">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-50">
          <Button
            variant="ghost"
            size="default"
            className="w-full justify-start text-neutral-700 hover:bg-neutral-100"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" /> Abrir en nueva pestaña
          </Button>
          <Button
            variant="destructive"
            size="default"
            className="w-full justify-start text-sm"
            onClick={() => {
              setOpen(false);
              handleDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Eliminar archivo
          </Button>
        </div>
      )}
      {error && <span className="text-[10px] text-red-500 mt-1">{error}</span>}
    </div>
  );
}
