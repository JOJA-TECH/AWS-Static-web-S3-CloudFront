variable "monitoring_alert_email" {
  description = "Correo para alertas del monitoreo. Si es null, el módulo de monitoreo no se crea."
  type        = string
  default     = null
  nullable    = true
}
