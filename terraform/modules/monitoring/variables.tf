variable "project_name" {
  description = "Nombre del proyecto."
  type        = string
}

variable "environment" {
  description = "Ambiente de despliegue."
  type        = string
}

variable "alert_email" {
  description = "Correo que recibirá las alertas SNS."
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront."
  type        = string
}

variable "assets_bucket_name" {
  description = "Nombre del bucket de activos."
  type        = string
}

variable "uploads_bucket_name" {
  description = "Nombre del bucket de cargas."
  type        = string
}

variable "logs_bucket_name" {
  description = "Nombre del bucket de logs."
  type        = string
}

variable "tags" {
  description = "Etiquetas de los recursos."
  type        = map(string)
  default     = {}
}
