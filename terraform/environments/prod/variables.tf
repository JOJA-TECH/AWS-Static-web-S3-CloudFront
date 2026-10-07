variable "aws_region" {
  description = "Región de AWS donde se despliegan los recursos del ambiente."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre corto del proyecto, usado en nombres de recursos y etiquetas."
  type        = string
  default     = "object-storage"
}

variable "bucket_name_prefix" {
  description = "Prefijo para los nombres de los buckets. Junto con el ambiente y el propósito forma el nombre globalmente único del bucket; ajústalo si el nombre resultante ya existe en AWS."
  type        = string
  default     = null
}

variable "domain_name" {
  description = "Dominio personalizado principal (apex) para el certificado ACM y los registros DNS. Déjalo en null para usar el dominio y certificado por defecto de CloudFront."
  type        = string
  default     = null

  validation {
    condition     = var.domain_name == null || can(regex("^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$", var.domain_name))
    error_message = "domain_name debe ser un FQDN válido en minúsculas (por ejemplo, ejemplo.com)."
  }

  validation {
    condition     = var.domain_name == null || var.route53_zone_id != null || var.route53_zone_name != null
    error_message = "Si defines domain_name, indica route53_zone_id o route53_zone_name de la Hosted Zone pública existente."
  }
}

variable "domain_subject_alternative_names" {
  description = "Dominios alternativos para el certificado ACM y aliases adicionales de CloudFront (por ejemplo, www.ejemplo.com)."
  type        = list(string)
  default     = []
}

variable "route53_zone_id" {
  description = "ID de la Hosted Zone pública existente en Route 53 donde se crean los registros. Si es null, la zona se resuelve con route53_zone_name."
  type        = string
  default     = null
}

variable "route53_zone_name" {
  description = "Nombre de la Hosted Zone pública existente para resolverla mediante data aws_route53_zone. Se ignora si route53_zone_id está definido."
  type        = string
  default     = null
}

variable "route53_validation_record_ttl" {
  description = "TTL de los registros CNAME de validación del certificado ACM."
  type        = number
  default     = 60
}
