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
    └── s3/                       # Módulo reutilizable de buckets S3
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

## Próximos pasos

La estructura está preparada para incorporar módulos independientes:

- Políticas de acceso del bucket de activos y Origin Access Control (OAC).
- Distribución con CloudFront.
- Certificados TLS con ACM.
- DNS con Route 53.
- Protección con AWS WAF.
- Funciones Lambda@Edge.
- Pipeline de CI/CD con GitHub Actions.
