# Infraestructura como código (Terraform)

Infraestructura en **AWS** gestionada con Terraform para la plataforma de
almacenamiento de objetos, con distribución global de contenido estático
mediante CloudFront en etapas posteriores.

## Estructura del repositorio

```text
terraform/
├── README.md                     # Este documento
├── .gitignore                    # Excluye estado, plugins y archivos sensibles
├── environments/
│   └── prod/                     # Ambiente de producción
│       ├── main.tf               # Composición de módulos y configuración del ambiente
│       ├── providers.tf          # Proveedor de AWS y configuración de región
│       ├── versions.tf           # Versiones de Terraform y del proveedor
│       ├── variables.tf          # Variables de entrada del ambiente
│       ├── outputs.tf            # Valores expuestos al finalizar el despliegue
│       └── terraform.tfvars.example   # Ejemplo de valores (sin secretos)
└── modules/
    ├── acm/                  # Certificados ACM (us-east-1) para CloudFront
    ├── cloudfront/           # Distribución CloudFront + OAC + políticas de caché
    ├── lambda-edge/          # Lambda@Edge: encabezados de seguridad en origin-response
    ├── route53/              # Registros DNS en Route 53
    └── s3/                   # Módulo reutilizable de buckets S3
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

La organización separa los **ambientes de ejecución** (`environments/`) de los
**módulos reutilizables** (`modules/`), de modo que se puedan agregar después
módulos independientes para CloudFront, ACM, Route 53, WAF, Lambda@Edge y
políticas de ciclo de vida sin reorganizar el proyecto.

## Requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.9.0
- Credenciales de AWS configuradas **fuera del repositorio**, mediante cualquiera de estos mecanismos:
  - Perfil de AWS CLI (`aws configure` o `~/.aws/credentials`).
  - Variables de entorno (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_PROFILE`).
  - Rol de IAM asumido por el entorno de ejecución.
  - Rol de GitHub Actions vía OIDC (etapa posterior de CI/CD).

> Nunca incluir claves de acceso, secretos ni credenciales en los archivos `.tf` ni en `terraform.tfvars`.

## Configuración

1. Copia el archivo de ejemplo y ajusta los valores:

   ```bash
   cd terraform/environments/prod
   cp terraform.tfvars.example terraform.tfvars
   ```

   `terraform.tfvars` está ignorado por Git, por lo que los valores privados no
   se versionan.

2. Exporta las credenciales de AWS o usa un perfil:

   ```bash
   export AWS_PROFILE=mi-perfil
   # o
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```

## Uso

Desde el directorio del ambiente:

```bash
cd terraform/environments/prod
terraform init        # Descarga proveedores y genera .terraform.lock.hcl
terraform validate    # Verifica la sintaxis y coherencia de la configuración
terraform plan        # Muestra el plan de cambios antes de aplicar
terraform apply       # Aplica los cambios (revisar el plan antes de confirmar)
terraform output      # Nombres y ARN de los buckets creados
```

Verificación de formato y validación completa:

```bash
cd terraform
terraform fmt -check -recursive
```

## Estrategia de estado

- El estado se ejecuta en modo **local** (`terraform.tfstate`), que junto con
  sus respaldos está excluido del repositorio mediante `.gitignore`: el estado
  puede contener información sensible y no debe versionarse.
- El archivo `.terraform.lock.hcl` **sí** se versiona: fija las versiones de
  los proveedores para ejecuciones reproducibles.
- En una etapa posterior se configurará un **backend remoto** en S3 con
  bloqueo mediante DynamoDB, por ejemplo:

  ```hcl
  # terraform {
  #   backend "s3" {
  #     bucket         = "nombre-del-bucket-de-estado"
  #     key            = "prod/terraform.tfstate"
  #     region         = "us-east-1"
  #     dynamodb_table = "terraform-locks"
  #     encrypt        = true
  #   }
  # }
  ```

## Buckets del ambiente (prod)

El ambiente `prod` crea tres buckets privados mediante el módulo `modules/s3`,
todos con propiedad `BucketOwnerEnforced`, bloqueo de acceso público, cifrado
SSE-S3 y versionado habilitados:

| Módulo | Propósito | Nombre por defecto |
|---|---|---|
| `s3_activos` | Contenido estático de la aplicación (futuro origen de CloudFront) | `<prefijo>-prod-activos` |
| `s3_cargas` | Archivos cargados por la aplicación o procesos autorizados | `<prefijo>-prod-cargas` |
| `s3_logs` | Registros de acceso y operación de los servicios | `<prefijo>-prod-logs` |

- El prefijo por defecto es `project_name`; se puede ajustar con la variable
  `bucket_name_prefix` en `terraform.tfvars` (los nombres de bucket son
  globales en AWS: si el nombre ya existe, cambia el prefijo).
- Las etiquetas `Project`, `Environment` y `ManagedBy` se aplican a todos los
  recursos mediante `default_tags`; cada bucket añade además `Purpose`.
- Después de `terraform apply`, los nombres y ARN quedan disponibles con
  `terraform output`.

## Módulos

### `modules/s3`

Módulo reutilizable para crear buckets S3 privados. Recibe:

| Parámetro | Descripción |
|---|---|
| `bucket_name` | Nombre globalmente único del bucket |
| `purpose` | Propósito del bucket (se aplica como etiqueta `Purpose`) |
| `tags` | Etiquetas adicionales |
| `versioning` | Habilita el versionado (por defecto `true`) |
| `sse_algorithm` | Cifrado: `AES256` (SSE-S3, por defecto) o `aws:kms` (SSE-KMS) |
| `kms_master_key_id` | Clave KMS, solo si `sse_algorithm = "aws:kms"` |
| `force_destroy` | Permite vaciar y eliminar el bucket al destruir (por defecto `false`) |
| `lifecycle_rules` | Reglas de ciclo de vida opcionales (transición y expiración) |

El módulo crea el bucket con propiedad `BucketOwnerEnforced`, bloqueo completo
de acceso público y cifrado del lado del servidor, y expone como outputs el
nombre, el ARN y el dominio regional del bucket (útil para CloudFront).

## `modules/lambda-edge`

Lambda@Edge agrega encabezados de seguridad HTTP a las respuestas de CloudFront
en el evento `origin-response`. Se implementa como una función de Node.js
(CommonJS) sin dependencias externas, empaquetada con `archive_file` y
publicada como una versión inmutable (`publish = true`).

### ¿Qué hace

Intercepta la respuesta del origen antes de que CloudFront la entregue al
visita­dor y agrega o reemplaza estos encabezados:

| Encabezado | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'; object-src 'none'; base-uri 'self'` |

Si un encabezado ya existía, se reemplaza por un único valor para evitar
duplicados. Se conserva el status code, el `statusDescription` y el `body`
originales.

### ¿Por qué `origin-response`

`origin-response` se ejecuta después de que CloudFront recibe la respuesta del
origen (S3) y antes de enviarla al cliente. Es el momento adecuado para
modificar encabezados de respuesta basados en el contenido real entregado por
el origen, y funciona tanto para respuestas en caché como para las que
provienen directamente del origen.

### ¿Por qué `us-east-1`

Las funciones Lambda@Edge deben crearse obligatoriamente en la región
`us-east-1`, independientemente de la región del resto de la infraestructura.
El módulo declara el alias de provider mediante
`configuration_aliases = [aws.us_east_1]` y el ambiente `prod` lo invoca con
`providers = { aws.us_east_1 = aws.us_east_1 }`.

### ¿Por qué una versión publicada

CloudFront no puede asociar `$LATEST`. Terraform publica una versión
inmutable (`publish = true`) y la distribución usa el `qualified_arn`
(ARN cualificado con número de versión), de modo que la asociación apunta a
una versión estable y reproducible. El cambio de código se detecta mediante
`source_code_hash`.

### Encabezados CSP y contenido de prueba

La política `Content-Security-Policy` propuesta es restrictiva
(`default-src 'self'`). El sitio de prueba en `test-content/` solo referencia
recursos propios bajo `/assets` (`style.css`, `logo.svg`) sin orígenes
externos, scripts ni estilos en línea, por lo que la CSP no bloquea ningún
recurso legítimo del sitio de prueba. Si se agregan orígenes externos o
recursos inline, la CSP debe ajustarse.

### Pruebas unitarias

Las pruebas están en `terraform/modules/lambda-edge/tests/index.test.js` y no
requieren dependencias externas (usan `node:assert` / `node:test`):

```bash
node --test terraform/modules/lambda-edge/tests/index.test.js
```

Verifican: presencia de los cuatro encabezados, capitalización de los nombres,
valores correctos, conservación de status code y body, ausencia de
duplicados, y comportamiento tanto sin encabezados previos como con
encabezados existentes.

### Validación de Terraform

```bash
cd terraform/environments/prod
terraform init -backend=false
terraform validate
```

Formato:

```bash
cd terraform
terraform fmt -recursive
terraform fmt -check -recursive
```

### Permisos IAM

El módulo crea un rol exclusivo (`aws_iam_role`) cuya política de confianza
permite ser asumido por `lambda.amazonaws.com` y `edgelambda.amazonaws.com`.
Adjunta la política administrada `AWSLambdaBasicExecutionRole` (mínimo
privilegio para escribir logs en CloudWatch Logs). No otorga permisos de S3,
CloudFront, WAF ni otros servicios, ya que la función solo modifica la
respuesta HTTP. No se incluyen credenciales en el código ni en variables.

### Replicación de Lambda@Edge

Tras publicar una versión y asociarla a CloudFront, la replicación de la
función a los edge locations puede tardar desde unos segundos hasta un par de
minutos. Durante ese periodo, algunas ubicaciones pueden seguir sirviendo la
respuesta sin los nuevos encabezados.

### Verificación con curl

Una vez desplegado, se puede verificar la presencia de los encabezados con:

```bash
curl -sS -D - -o /dev/null https://DOMINIO_CLOUDFRONT/index.html
```

Se espera observar en las cabeceras de respuesta:

```
Strict-Transport-Security
X-Content-Type-Options
X-Frame-Options
Content-Security-Policy
```

Nota: la implementación solicitada es Lambda@Edge. Existe la alternativa de
una CloudFront Response Headers Policy, pero queda fuera de alcance de esta
tarea por requerimiento académico.

## Próximos pasos

La estructura está preparada para incorporar módulos independientes:

- Protección con AWS WAF.
- Pipeline de CI/CD con GitHub Actions.
