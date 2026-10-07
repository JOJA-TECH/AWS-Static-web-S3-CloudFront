variable "domain_name" {
  description = "Dominio principal del certificado (por ejemplo, ejemplo.com)."
  type        = string

  validation {
    condition     = can(regex("^([a-z0-9]([a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}$", var.domain_name))
    error_message = "domain_name debe ser un FQDN válido en minúsculas (por ejemplo, ejemplo.com)."
  }
}

variable "subject_alternative_names" {
  description = "Dominios alternativos incluidos en el certificado (por ejemplo, www.ejemplo.com)."
  type        = list(string)
  default     = []
}

variable "zone_id" {
  description = "ID de la Hosted Zone pública existente donde se crean los registros CNAME de validación."
  type        = string
}

variable "validation_record_ttl" {
  description = "TTL de los registros CNAME de validación DNS."
  type        = number
  default     = 60
}

variable "tags" {
  description = "Etiquetas adicionales para el certificado."
  type        = map(string)
  default     = {}
}
