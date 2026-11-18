# Infraestructura como código (Terraform)

Infraestructura en **AWS** gestionada con Terraform para la plataforma de
almacenamiento de objetos y distribución global de contenido estático mediante
CloudFront, con protección de AWS WAF y encabezados de seguridad vía
Lambda@Edge.

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
    ├── acm/                      # Certificados TLS y validación DNS
    ├── cloudfront/               # Distribución, OAC, WAF y Lambda@Edge
    ├── lambda-edge/              # Encabezados de seguridad en origin-response
    ├── route53/                  # Registros DNS para CloudFront
    ├── s3/                       # Módulo reutilizable de buckets S3
    └── waf/                      # Web ACL para CloudFront en modo COUNT
```

La organización separa los **ambientes de ejecución** (`environments/`) de los
**módulos reutilizables** (`modules/`), que componen los recursos de AWS de
forma independiente.

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
terraform output      # Nombres y ARN de los recursos creados
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
| `s3_activos` | Contenido estático de la aplicación (origen de CloudFront) | `<prefijo>-prod-activos` |
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

### `modules/waf`

Crea un Web ACL con scope `CLOUDFRONT` en `us-east-1`, con los grupos
administrados `AWSManagedRulesCommonRuleSet`,
`AWSManagedRulesKnownBadInputsRuleSet` y
`AWSManagedRulesAmazonIpReputationList`. Los tres usan `override_action` en
modo `COUNT`; el Web ACL permite por defecto y habilita métricas de CloudWatch
y solicitudes muestreadas para observar coincidencias.

El ARN se expone como `waf_web_acl_arn` y se asocia a la distribución
CloudFront. En modo `COUNT`, el WAF registra las coincidencias sin bloquear
solicitudes. El logging del WAF se configurará posteriormente.

### `modules/lambda-edge`

Lambda@Edge agrega encabezados de seguridad HTTP a las respuestas de CloudFront
en el evento `origin-response`. Se implementa como una función de Node.js
(CommonJS) sin dependencias externas, empaquetada con `archive_file` y
publicada como una versión inmutable (`publish = true`).

Intercepta la respuesta del origen antes de que CloudFront la entregue al
visitante y agrega o reemplaza estos encabezados:

| Encabezado | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'; object-src 'none'; base-uri 'self'` |

CloudFront no puede asociar `$LATEST`, por lo que Terraform publica una
versión inmutable (`publish = true`) y la distribución usa el `qualified_arn`
(ARN cualificado con número de versión).

## Próximos pasos

- Ejecutar `terraform fmt`, `validate` y revisar el plan antes de aplicar.
- Aplicar en un ambiente de prueba o en una ventana controlada; verificar el
  dominio, las métricas de WAF y las solicitudes muestreadas.
- Habilitar logging y alertas para WAF.
- Cambiar progresivamente las reglas administradas de COUNT a bloqueo y
  comprobar que la asociación con CloudFront persiste después de la
  propagación.
- Configurar GitHub Actions con OIDC y estado remoto en S3 antes de usarlo
  como proceso de producción.
