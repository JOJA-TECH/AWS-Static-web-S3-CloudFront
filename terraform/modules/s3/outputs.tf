output "bucket_name" {
  description = "Nombre del bucket S3 creado."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "ARN del bucket S3 creado."
  value       = aws_s3_bucket.this.arn
}

output "bucket_regional_domain_name" {
  description = "Dominio regional del bucket, útil para CloudFront, políticas y automatizaciones posteriores."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}
