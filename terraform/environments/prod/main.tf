# Configuración principal del ambiente prod.

locals {
  environment = "prod"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
  }
}
