# Integración aislada del monitoreo.
# Este archivo no modifica WAF, Lambda@Edge ni GitHub Actions.
# Se activa únicamente cuando monitoring_alert_email tiene un valor.

module "monitoring" {
  count  = var.monitoring_alert_email == null ? 0 : 1
  source = "../../modules/monitoring"

  project_name               = var.project_name
  environment                = local.environment
  alert_email                = var.monitoring_alert_email
  cloudfront_distribution_id = module.cloudfront.distribution_id
  assets_bucket_name         = module.s3_activos.bucket_name
  uploads_bucket_name        = module.s3_cargas.bucket_name
  logs_bucket_name           = module.s3_logs.bucket_name
  tags                       = local.common_tags
}
