output "distribution_id" {
  description = "ID de la distribución de CloudFront."
  value       = aws_cloudfront_distribution.this.id
}

output "distribution_arn" {
  description = "ARN de la distribución de CloudFront."
  value       = aws_cloudfront_distribution.this.arn
}

output "distribution_domain_name" {
  description = "Nombre de dominio asignado a la distribución."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "distribution_hosted_zone_id" {
  description = "ID de la zona hospedada de CloudFront para registros alias de Route 53."
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}

output "oac_id" {
  description = "ID del Origin Access Control."
  value       = aws_cloudfront_origin_access_control.this.id
}