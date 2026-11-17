# Frontend - joja.click

Aplicación estática (React + TypeScript + Vite + Tailwind CSS) de la plataforma de almacenamiento y distribución de contenido. Se despliega en el bucket S3 de activos y se distribuye mediante CloudFront bajo `https://joja.click`.

## Stack

- React 18 + TypeScript
- Vite (build y dev server)
- Tailwind CSS (estilos)
- React Router (navegación)
- Lucide React (iconos)
- ESLint + Prettier (lint y formato)

## Estructura

```
frontend/
├── src/
│   ├── main.tsx              # Punto de entrada (BrowserRouter)
│   ├── App.tsx               # Rutas principales
│   ├── index.css             # Tailwind + capas base
│   ├── lib/utils.ts          # Utilidades (formato bytes/fecha, iconos, cn)
│   ├── types/index.ts        # Tipos compartidos (FileItem, UploadService, etc.)
│   ├── types/env.d.ts        # Tipos de import.meta.env (Vite)
│   ├── services/
│   │   ├── api.ts            # Contratos + implementación MOCK (temporal)
│   │   ├── mockData.ts       # Datos simulados (archivos, actividad, buckets, salud)
│   │   └── storage.ts        # Adaptador de almacenamiento (delega en api)
│   ├── hooks/
│   │   ├── useFiles.ts       # Listado, filtros, orden, paginación, eliminación
│   │   └── useUpload.ts      # Cola de cargas, progreso, reintento, cancelación
│   ├── components/
│   │   ├── ui/               # Primitivos (Button, Card, Badge, StatCard, Input, Select...)
│   │   ├── layout/           # Navbar, Sidebar
│   │   ├── file/             # FileTable, FileRow, FileActions, ViewToggle
│   │   └── upload/           # DropZone, UploadQueue, UploadItem, ProgressBar
│   └── pages/
│       ├── Dashboard.tsx     # Panel: métricas, gráfico, buckets, servicios, actividad
│       ├── FileExplorer.tsx  # Explorador: tabla, búsqueda, filtros, paginación
│       ├── Upload.tsx        # Carga: drop-zone, cola, estado por archivo
│       └── NotFound.tsx      # 404
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
├── .env.example              # Copia a .env.local para desarrollar
├── .npmrc                    # Permite scripts de build (esbuild) en CI
└── .gitignore
```

## Scripts

```bash
pnpm install        # Instala dependencias
pnpm dev            # Servidor de desarrollo (http://localhost:5173)
pnpm build          # TypeScript + build de producción en dist/
pnpm preview        # Vista previa del build
pnpm lint           # ESLint
pnpm format         # Prettier
```

## Seguridad (importante)

- **No incluir credenciales de AWS** en el frontend: ni `AWS_ACCESS_KEY_ID`, ni `AWS_SECRET_ACCESS_KEY`, ni tokens temporales.
- El frontend **no usa `@aws-sdk/client-s3` con credenciales hardcodeadas**.
- Las subidas se preparan mediante una **API autorizada** que genera URLs prefirmadas de S3.
- Mientras no exista la API, `src/services/api.ts` usa una implementación **MOCK** claramente separada.

## Migración de mock a API real

En `src/services/api.ts` se definen las interfaces `FilesService`, `UploadService` y `StatsService`. Actualmente exportan implementaciones mock:

```ts
export const filesService: FilesService = mockFilesService;
export const uploadService: UploadService = mockUploadService;
export const statsService: StatsService = mockStatsService;
```

Cuando exista el backend, crear implementaciones reales que llamen a los endpoints y sustituir esas tres líneas. Endpoints sugeridos:

- `GET    /api/files`          - listar (query: search, type, status, sort, page, pageSize)
- `GET    /api/files/:id`      - detalle
- `DELETE /api/files/:id`      - eliminar
- `POST   /api/upload/url`     - URL prefirmada de S3 + objectKey
- `POST   /api/upload/complete` - notificar subida completada
- `GET    /api/stats`          - métricas de almacenamiento
- `GET    /api/activity`       - actividad reciente
- `GET    /api/buckets`        - estado de buckets
- `GET    /api/health`         - salud de servicios

Nunca exponer `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` al navegador.

## Despliegue

El workflow `.github/workflows/content.yml`:

1. Obtiene `activos_bucket_name` y `cloudfront_distribution_id` de los outputs de Terraform.
2. Instala dependencias del frontend (`pnpm install --frozen-lockfile`).
3. Compila (`pnpm run build`) → `frontend/dist/`.
4. Sincroniza `frontend/dist/` al bucket de activos (`aws s3 sync --delete`).
5. Invalida la caché de CloudFront (`aws cloudfront create-invalidation --paths "/*"`).

Se dispara tras el éxito de `Terraform CI/CD` o manualmente (`workflow_dispatch`).

## Variables de entorno

Copiar `.env.example` a `.env.local` para desarrollo local. Los valores se inyectan en tiempo de compilación mediante Vite (`import.meta.env.*`). Nunca incluir secretos de AWS.
