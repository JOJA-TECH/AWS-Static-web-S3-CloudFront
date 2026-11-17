import { Link } from 'react-router-dom';
import { CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DropZone } from '@/components/upload/DropZone';
import { UploadQueue } from '@/components/upload/UploadQueue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cargar archivos</h1>
          <p className="text-neutral-500 text-sm">
            Selecciona uno o varios archivos. Se prepararán para subirse al bucket de cargas
            mediante URLs prefirmadas (por implementar).
          </p>
        </div>
        <Link to="/archivos" className="text-sm text-brand-600 hover:underline">
          Ir al explorador
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleccionar archivos</CardTitle>
            </CardHeader>
            <CardContent>
              <DropZone />
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <h4 className="text-sm font-semibold text-neutral-900 mb-2">Información importante</h4>
                <ul className="text-sm text-neutral-600 space-y-2 list-disc pl-5">
                  <li>No se almacenan credenciales de AWS en el navegador.</li>
                  <li>Las URLs de subida las genera una API autorizada (en desarrollo: simulación).</li>
                  <li>Cada archivo se valida antes de enviarse (extensión y tamaño máximo 100 MB).</li>
                  <li>Puedes cancelar o reintentar cada carga individualmente.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado de las cargas</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadQueue />
            </CardContent>
          </Card>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <CloudUpload className="h-4 w-4 text-brand-600" /> Cómo funcionará con API real
            </h3>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-500" />
                <div>
                  <div className="font-medium text-neutral-900">1. Solicitar URL prefirmada</div>
                  <div className="text-[12px]">El frontend pide al backend una URL de subida con vencimiento corto.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-500" />
                <div>
                  <div className="font-medium text-neutral-900">2. Subir directamente a S3</div>
                  <div className="text-[12px]">El navegador sube el archivo a la URL prefirmada sin credenciales.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <div className="font-medium text-neutral-900">3. Notificar completado</div>
                  <div className="text-[12px]">El backend registra el objeto y puede invalidar la caché de CloudFront.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
