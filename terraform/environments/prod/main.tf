# Configuración principal del ambiente prod.

locals {
  environment = "prod"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
  }

  bucket_prefix = coalesce(var.bucket_name_prefix, var.project_name)

  bucket_names = {
    activos = "${local.bucket_prefix}-${local.environment}-activos"
    cargas  = "${local.bucket_prefix}-${local.environment}-cargas"
    logs    = "${local.bucket_prefix}-${local.environment}-logs"
  }
}

# Buckets del ambiente: contenido estático, cargas de usuarios y logs. Todos
# quedan privados, con cifrado, versionado y acceso público bloqueado.
module "s3_activos" {
  source = "../../modules/s3"

  bucket_name = local.bucket_names.activos
  purpose     = "activos"
}

module "s3_cargas" {
  source = "../../modules/s3"

  bucket_name = local.bucket_names.cargas
  purpose     = "cargas"
}

module "s3_logs" {
  source = "../../modules/s3"

  bucket_name = local.bucket_names.logs
  purpose     = "logs"
}
