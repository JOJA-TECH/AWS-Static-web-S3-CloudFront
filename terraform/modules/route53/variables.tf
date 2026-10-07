variable "zone_id" {
  description = "ID de la Hosted Zone pública existente donde se crean los registros alias."
  type        = string
}

variable "record_names" {
  description = "FQDNs para los que se crean los registros alias (por ejemplo, ejemplo.com y www.ejemplo.com)."
  type        = list(string)
}

variable "target_dns_name" {
  description = "Nombre DNS del destino del alias (por ejemplo, el dominio de la distribución CloudFront)."
  type        = string
}

variable "target_zone_id" {
  description = "ID de la Hosted Zone del destino del alias (para CloudFront, el hosted zone ID de la distribución)."
  type        = string
}

variable "create_aaaa_records" {
  description = "Crea los registros alias AAAA equivalentes; habilitarlo solo si el destino sirve IPv6."
  type        = bool
  default     = true
}
