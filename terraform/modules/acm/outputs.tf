output "certificate_arn" {
  description = "ARN del certificado emitido en us-east-1."
  value       = aws_acm_certificate.this.arn
}

output "certificate_domain_name" {
  description = "Dominio principal del certificado."
  value       = aws_acm_certificate.this.domain_name
}

output "certificate_status" {
  description = "Estado del certificado (ISSUED una vez completada la validación DNS)."
  value       = aws_acm_certificate.this.status
}

output "validation_record_fqdns" {
  description = "FQDNs de los registros CNAME de validación creados en Route 53."
  value       = [for record in aws_route53_record.validation : record.fqdn]
}
