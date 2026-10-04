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
