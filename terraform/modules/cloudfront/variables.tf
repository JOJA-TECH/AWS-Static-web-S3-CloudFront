variable "project_name" {
  description = "Nombre del proyecto usado para nombrar los recursos de CloudFront."
  type        = string
}

variable "bucket_id" {
  description = "ID o nombre del bucket S3 que contiene los activos."
  type        = string
}

variable "bucket_arn" {
  description = "ARN del bucket S3 que contiene los activos."
  type        = string
}

variable "bucket_regional_domain_name" {
  description = "Nombre de dominio regional del bucket S3 usado como origen."
  type        = string
}

variable "price_class" {
  description = "Clase de precio de CloudFront."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class debe ser PriceClass_100, PriceClass_200 o PriceClass_All."
  }
}

variable "aliases" {
  description = "Nombres de dominio alternativos para la distribución."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ARN de un certificado ACM ubicado en us-east-1; null usa el certificado predeterminado de CloudFront."
  type        = string
  default     = null
}

variable "web_acl_id" {
  description = "ID o ARN del Web ACL asociado a la distribución."
  type        = string
  default     = null
}

variable "tags" {
  description = "Etiquetas adicionales para los recursos de CloudFront."
  type        = map(string)
  default     = {}
}