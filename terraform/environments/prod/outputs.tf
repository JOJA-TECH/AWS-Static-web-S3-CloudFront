output "aws_region" {
  description = "Región de AWS donde se despliega el ambiente."
  value       = var.aws_region
}

output "activos_bucket_name" {
  description = "Nombre del bucket de activos (contenido estático)."
  value       = module.s3_activos.bucket_name
}

output "activos_bucket_arn" {
  description = "ARN del bucket de activos (contenido estático)."
  value       = module.s3_activos.bucket_arn
}

output "cargas_bucket_name" {
  description = "Nombre del bucket de cargas."
  value       = module.s3_cargas.bucket_name
}

output "cargas_bucket_arn" {
  description = "ARN del bucket de cargas."
  value       = module.s3_cargas.bucket_arn
}

output "logs_bucket_name" {
  description = "Nombre del bucket de logs."
  value       = module.s3_logs.bucket_name
}

output "logs_bucket_arn" {
  description = "ARN del bucket de logs."
  value       = module.s3_logs.bucket_arn
}

output "cloudfront_domain_name" {
  description = "Nombre de dominio asignado a la distribución CloudFront."
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront."
  value       = module.cloudfront.distribution_id
}

output "cloudfront_hosted_zone_id" {
  description = "ID de la zona hospedada de CloudFront para registros alias de Route 53."
  value       = module.cloudfront.distribution_hosted_zone_id
}

output "acm_certificate_arn" {
  description = "ARN del certificado ACM usado por CloudFront (null si no hay dominio personalizado)."
  value       = local.custom_domain_enabled ? module.acm[0].certificate_arn : null
}

output "route53_zone_id" {
  description = "ID de la Hosted Zone pública usada para los registros del dominio (null si no hay dominio personalizado)."
  value       = local.route53_zone_id
}

output "route53_record_fqdns" {
  description = "FQDNs de los registros alias A/AAAA creados en Route 53."
  value       = local.custom_domain_enabled ? module.route53[0].record_fqdns : []
}
