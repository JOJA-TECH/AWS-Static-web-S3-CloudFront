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
    condition     = var.domain_name == null || var.create_route53_zone || var.route53_zone_id != null || var.route53_zone_name != null
    error_message = "Si defines domain_name, indica route53_zone_id, route53_zone_name o activa create_route53_zone para crear una Hosted Zone pública nueva."
  }
}

variable "domain_subject_alternative_names" {
  description = "Dominios alternativos para el certificado ACM y aliases adicionales de CloudFront (por ejemplo, www.ejemplo.com)."
  type        = list(string)
  default     = []
}

variable "route53_zone_id" {
  description = "ID de la Hosted Zone pública existente en Route 53 donde se crean los registros. Si es null, la zona se resuelve con route53_zone_name. Se ignora si create_route53_zone está activo."
  type        = string
  default     = null
}

variable "route53_zone_name" {
  description = "Nombre de la Hosted Zone pública: nombre de la zona a crear cuando create_route53_zone está activo, o nombre de la zona existente a resolver con data. Si es null y se crea, se usa domain_name. Para un sitio en subdominio, indica aquí el dominio padre (p. ej. joja.click)."
  type        = string
  default     = null
}

variable "create_route53_zone" {
  description = "Crea una Hosted Zone pública nueva. Su nombre es route53_zone_name, o domain_name si no se indica. Luego hay que delegar los name servers en el registrador."
  type        = bool
  default     = false
}

variable "route53_validation_record_ttl" {
  description = "TTL de los registros CNAME de validación del certificado ACM."
  type        = number
  default     = 60
}
