# Documentación de Soporte — AWS Static Web (S3 + CloudFront)

**Repositorio:** `infra/AWS-Static-web-S3-CloudFront`  
**Proyecto:** joja.click — Plataforma de almacenamiento y distribución de contenido estático en AWS  
**Última actualización:** 2026-11-18

---

## 1. Visión general

La plataforma despliega en AWS:

| Componente | Servicio AWS | Propósito |
|------------|--------------|-----------|
| Contenido estático | Amazon S3 (bucket `activos`) | Sitio web (frontend build) |
| Distribución | Amazon CloudFront | CDN con origen en S3 + Lambda@Edge |
| Encabezados de seguridad | Lambda@Edge (origin-response) | HSTS, X-Content-Type-Options, X-Frame-Options, CSP |
| API de archivos | API Gateway HTTP API + Lambda (Python) | Listar archivos, stats, URLs presignadas de subida |
| Subidas de usuarios | Amazon S3 (bucket `cargas`) | Objetos subidos desde el frontend |
| Registros | Amazon S3 (bucket `logs`) | Logs de acceso de CloudFront |
| Dominio (opcional) | Route 53 + ACM | Zona pública + certificado SSL |
| Firewall | WAF (Web ACL global) | Reglas administradas para CloudFront |
| Estado de Terraform | S3 (bucket remoto) | Backend de estado con bloqueo DynamoDB |

**Flujos de CI/CD (GitHub Actions):**
- `.github/workflows/terraform.yml` — valida e aplica infraestructura en `main`.
- `.github/workflows/content.yml` — build del frontend y sync a S3 tras Terraform exitoso.

---

## 2. Prerrequisitos

### 2.1 Cuenta de AWS
- Cuenta de AWS activa con permisos para crear: S3, CloudFront, ACM, Route 53, API Gateway, Lambda, IAM, WAF, DynamoDB.
- Usuario o rol con capacidad de asumir un rol mediante **OIDC** (para GitHub Actions) o credenciales locales (`~/.aws/credentials`).
- Región principal: `us-east-1` (requerido para ACM + Lambda@Edge).

### 2.2 Herramientas locales (para pruebas y despliegue manual)
| Herramienta | Versión mínima | Propósito |
|-------------|----------------|-----------|
| Terraform | ≥ 1.9.0 | Infraestructura como código |
| Node.js | ≥ 20 | Runtime del frontend |
| pnpm | ≥ 8 | Gestor de dependencias del frontend |
| Python | ≥ 3.12 | Runtime de la Lambda de API |
| AWS CLI | última | Comandos de AWS y sync de contenido |
| git | última | Control de versiones |

Verificar versiones:
```bash
terraform version
node --version
pnpm --version
python3 --version
aws --version
```

### 2.3 Credenciales AWS configuradas
```bash
aws sts get-caller-identity
```
Debe devolver un usuario/rol válido. Si no, configurar `~/.aws/credentials` o exportar variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.

### 2.4 Dominio (opcional, solo si se usa dominio personalizado)
- Un dominio registrado (ejemplo: `joja.click`).
- Acceso al registrador para delegar **name servers** de la Hosted Zone de Route 53 que Terraform creará.
- El certificado ACM se emite en `us-east-1` y requiere validación DNS (CNAME) en esa zona.

---

## 3. Pasos previos de preparación

### 3.1 Clonar el repositorio
```bash
git clone https://github.com/JOJA-TECH/AWS-Static-web-S3-CloudFront.git
cd AWS-Static-web-S3-CloudFront
```

### 3.2 Preparar el bucket de estado remoto de Terraform
El backend de Terraform usa S3. El bucket debe existir **antes** de `terraform init -backend-config`.

```bash
export AWS_REGION=us-east-1
export TF_STATE_BUCKET=<nombre-unico-para-estado-terraform>

# Crear bucket de estado (si no existe)
aws s3api head-bucket --bucket "$TF_STATE_BUCKET" 2>/dev/null || \
  aws s3api create-bucket \
    --bucket "$TF_STATE_BUCKET" \
    --region "$AWS_REGION" \
    --create-bucket-configuration LocationConstraint="$AWS_REGION"

# Habilitar versionado y cifrado (recomendado)
aws s3api put-bucket-versioning --bucket "$TF_STATE_BUCKET" --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$TF_STATE_BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

> **Nota:** si `AWS_REGION` es `us-east-1`, omitir `--create-bucket-configuration LocationConstraint`.

### 3.3 Configurar variables de entorno de Terraform
Copiar el archivo de ejemplo y ajustar:

```bash
cp terraform/environments/prod/terraform.tfvars.example \
   terraform/environments/prod/terraform.tfvars
```

Editar `terraform.tfvars` con los valores reales:

```hcl
# terraform/environments/prod/terraform.tfvars
aws_region       = "us-east-1"
project_name     = "object-storage"
bucket_name_prefix = "mi-prefijo"   # opcional; deja null para usar project_name

# Dominio personalizado (opcional). Si usas null, CloudFront usa su dominio por defecto.
domain_name               = "joja.click"
domain_subject_alternative_names = ["www.joja.click"]
route53_zone_name         = "joja.click"
create_route53_zone       = true   # true si quieres que Terraform cree la Hosted Zone

# Backend remoto de Terraform
state_bucket   = "<nombre-del-bucket-de-estado>"
state_lock_table = ""   # opcional; tabla DynamoDB para bloqueo de estado

# TTL de registros de validación ACM (segundos)
route53_validation_record_ttl = 60
```

### 3.4 Preparar el frontend
```bash
cd frontend
cp .env.example .env   # si existe; de lo contrario crear .env
```

Variables de entorno del frontend (`VITE_*` se inyectan en tiempo de build):
- `VITE_API_BASE_URL` — URL base de la API Gateway (output `api_endpoint` de Terraform).
- `VITE_ASSETS_BUCKET_PREFIX` — prefijo del bucket de activos (default: `object-storage-prod-activos`).
- `VITE_SITE_DOMAIN` — dominio del sitio (default: `joja.click`).

Instalar dependencias:
```bash
corepack enable && corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile --ignore-scripts
```

### 3.5 OIDC para GitHub Actions (si se usa CI/CD)
El workflow de Terraform asume un rol mediante OIDC. Requisitos en AWS:
1. Proveedor de identidad OIDC para `https://token.actions.githubusercontent.com`.
2. Rol de IAM con política de confianza hacia el repositorio de GitHub.
3. Secreto del repositorio `AWS_ROLE_ARN` con el ARN del rol.
4. Secreto del repositorio `TF_STATE_BUCKET` con el nombre del bucket de estado.

---

## 4. Despliegue paso a paso

### Opción A: Despliegue manual local

```bash
# 1. Validar infraestructura
terraform init -backend=false -chdir=terraform/environments/prod
terraform validate -chdir=terraform/environments/prod
terraform fmt -check -recursive

# 2. Aplicar infraestructura (crea recursos en AWS)
terraform init -backend-config="bucket=$TF_STATE_BUCKET" \
  -chdir=terraform/environments/prod
terraform plan -chdir=terraform/environments/prod   # revisar antes de aplicar
terraform apply -auto-approve -chdir=terraform/environments/prod   # ⚠️ crea recursos facturables
```

```bash
# 3. Obtener outputs de Terraform
cd terraform/environments/prod
terraform output -raw api_endpoint
terraform output -raw activos_bucket_name
terraform output -raw cloudfront_distribution_id
terraform output -raw cloudfront_distribution_domain_name
cd ../../..
```

```bash
# 4. Build y despliegue del frontend
cd frontend
export VITE_API_BASE_URL=https://<api_id>.execute-api.us-east-1.amazonaws.com/prod
pnpm run build
cd ..

# 5. Sync de contenido a S3
aws s3 sync frontend/dist/ "s3://<activos_bucket_name>" --delete

# 6. Invalidar caché de CloudFront
aws cloudfront create-invalidation \
  --distribution-id "<cloudfront_distribution_id>" \
  --paths "/*"
```

### Opción B: Despliegue por GitHub Actions

1. Subir cambios a `main` (el workflow `terraform.yml` ejecuta plan y apply en push).
2. Tras el apply exitoso, ejecutar manualmente `content.yml` (`workflow_dispatch`) o esperar al disparo `workflow_run`.
3. `content.yml` obtiene los outputs de Terraform, hace `pnpm install`, `pnpm run build`, `aws s3 sync` y `create-invalidation`.

---

## 5. Estructura del repositorio

```
.
├── terraform/
│   ├── environments/
│   │   └── prod/                 # configuración del ambiente prod
│   │       ├── main.tf           # módulos, locales, recursos del ambiente
│   │       ├── variables.tf      # variables de entrada
│   │       ├── outputs.tf        # outputs del ambiente
│   │       ├── backend.tf        # backend S3 (sin variables)
│   │       ├── providers.tf      # providers aws y aws.us_east_1
│   │       ├── versions.tf       # versiones de proveedores
│   │       └── monitoring*.tf    # CloudWatch monitoring
│   └── modules/
│       ├── s3/                   # buckets privados + CORS + ciclo de vida
│       ├── cloudfront/           # distribución + OAC + Lambda@Edge
│       ├── lambda-edge/          # CSP + encabezados de seguridad
│       ├── api/                  # Lambda Python + API Gateway HTTP API
│       ├── acm/                  # certificado SSL público
│       ├── route53/              # registros alias A/AAAA
│       ├── monitoring/           # alarmas CloudWatch
│       └── waf/                  # Web ACL global
├── frontend/
│   ├── src/
│   │   ├── services/api.ts       # clientes de la API (archivos, stats, upload)
│   │   ├── hooks/useUpload.ts    # lógica de subida con URLs presignadas
│   │   ├── pages/Upload.tsx      # página de subida
│   │   ├── pages/FileExplorer.tsx# explorador de archivos
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── test-content/
│   ├── index.html                # contenido estático de prueba
│   └── assets/                   # logo.svg, style.css
├── .github/workflows/
│   ├── terraform.yml             # CI/CD de infraestructura
│   └── content.yml               # despliegue de contenido estático
└── DOCUMENTACION_SOPORTE.md      # este archivo
```

---

## 6. Variables de entorno clave

### Terraform (`terraform/environments/prod/terraform.tfvars`)
| Variable | Descripción | Valor ejemplo |
|----------|-------------|---------------|
| `domain_name` | Dominio principal para ACM y Route 53 | `joja.click` |
| `create_route53_zone` | Crear Hosted Zone pública nueva | `true` / `false` |
| `state_bucket` | Bucket S3 para estado remoto de Terraform | `mi-bucket-estado-tf` |
| `bucket_name_prefix` | Prefijo para nombres de buckets | `mi-proyecto` |

### Frontend (`.env` o variables de build `VITE_*`)
| Variable | Descripción | Valor ejemplo |
|----------|-------------|---------------|
| `VITE_API_BASE_URL` | Endpoint de la API Gateway | `https://abc.execute-api.us-east-1.amazonaws.com/prod` |
| `VITE_ASSETS_BUCKET_PREFIX` | Prefijo del bucket de activos | `object-storage-prod-activos` |
| `VITE_SITE_DOMAIN` | Dominio del sitio | `joja.click` |

---

## 7. Comandos útiles

### Terraform
```bash
terraform fmt -check -recursive
terraform validate -chdir=terraform/environments/prod
terraform plan -chdir=terraform/environments/prod
terraform apply -auto-approve -chdir=terraform/environments/prod
terraform output -raw api_endpoint -chdir=terraform/environments/prod
```

### Frontend
```bash
cd frontend
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec tsc --noEmit          # typecheck
VITE_API_BASE_URL=<url> pnpm run build   # build de producción
cd ..
```

### AWS CLI
```bash
# Listar objetos del bucket de cargas
aws s3api list-objects-v2 --bucket <cargas_bucket_name>

# Ver objeto específico
aws s3api get-object --bucket <cargas_bucket_name> --key cargas/<archivo> /tmp/salida

# Sync de frontend
aws s3 sync frontend/dist/ s3://<activos_bucket_name> --delete

# Invalidar CloudFront
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### Pruebas unitarias (Lambda@Edge)
```bash
node --test terraform/modules/lambda-edge/tests/index.test.js
```

### Compilación Lambda API (Python)
```bash
python3 -m py_compile terraform/modules/api/lambda_function.py
```

---

## 8. Solución de problemas comunes
### 8.1 `terraform apply` falla por dominio personalizado

**Síntoma:** Error en ACM o Route 53.

**Causa:** Si `domain_name` está definido, se requiere `route53_zone_id`, `route53_zone_name` o `create_route53_zone = true`. Además, los name servers de la Hosted Zone creada deben delegarse en el registrador del dominio antes de que ACM pueda validar el certificado.

**Solución:** Verificar `terraform.tfvars` y, si se crea la zona, copiar los name servers (output `route53_name_servers`) al registrador del dominio.

---

## 9. Seguridad

- Los buckets S3 están privados con **Bloqueo de acceso público** y **BucketOwnerEnforced**.
- El frontend **nunca** contiene credenciales de AWS. Toda escritura a S3 usa URLs presignadas generadas por la API Lambda.
- La API Lambda usa un rol de IAM con permisos mínimos sobre el bucket de destino.
- Lambda@Edge inyecta encabezados de seguridad en todas las respuestas de CloudFront.
- WAF está asociado a la distribución de CloudFront (reglas administradas en modo de conteo).

---

## 10. Costos (referencia)

- **S3:** almacenamiento de objetos + solicitudes PUT/GET.
- **CloudFront:** transferencia de datos salida + solicitudes HTTP/HTTPS.
- **Lambda:** invocaciones + duración (Lambda@Edge y API).
- **API Gateway:** solicitudes recibidas.
- **Route 53:** zona alojada + consultas DNS.
- **ACM:** certificado público gratuito.
- **WAF:** ACL + reglas por solicitud.

> Los precios varían por región. Revisar la calculadora de AWS antes de aplicar en producción.

---

## 11. Contacto y mantenimiento

- Equipos: infraestructura, frontend, seguridad.
- Canales: issues y pull requests en el repositorio de GitHub.
- Antes de aplicar cambios en `main`, revisar siempre `terraform plan`.
