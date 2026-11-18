import { useState, useRef } from 'react';
import { Upload, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { useUpload } from '@/hooks/useUpload';
import { cn } from '@/lib/utils';

type Props = Pick<ReturnType<typeof useUpload>, 'addFiles' | 'isActive'>;

export function DropZone({ addFiles, isActive }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-10 text-center transition-all duration-200',
        dragActive
          ? 'border-brand-500 bg-brand-50'
          : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50',
      )}
    >
      <div className={cn('mb-3 p-3 rounded-full', dragActive ? 'bg-brand-100 text-brand-600' : 'bg-neutral-200 text-neutral-500')}>
        <Upload className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
        {dragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic'}
      </h3>
      <p className="text-sm text-neutral-500 mb-4">
        Admite imágenes, documentos, video y audio (máx. 100 MB por archivo).
      </p>
      <Button
        variant="default"
        onClick={() => fileInput.current?.click()}
        disabled={isActive}
      >
        <FilePlus className="mr-2 h-4 w-4" /> Seleccionar archivos
      </Button>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
        }}
      />
      <p className="mt-3 text-xs text-neutral-400">
        Mantén pulsada ⌘/Ctrl para seleccionar varios archivos
      </p>
    </div>
  );
}
