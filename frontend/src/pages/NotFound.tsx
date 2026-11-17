import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <EmptyState
        icon={<AlertCircle className="h-10 w-10 text-neutral-400" />}
        title="Página no encontrada"
        description="La ruta que buscas no existe. Vuelve al panel de control."
        action={
          <Button onClick={() => navigate('/')}>
            Volver al panel
          </Button>
        }
      />
    </div>
  );
}
