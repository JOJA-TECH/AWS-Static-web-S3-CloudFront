variable "bucket_name" {
  description = "Nombre del bucket S3 de activos a consultar."
  type        = string
}

variable "bucket_arn" {
  description = "ARN del bucket S3 de activos."
  type        = string
}

variable "allowed_origin" {
  description = "Origen permitido para CORS (p. ej. https://joja.click)."
  type        = string
}
