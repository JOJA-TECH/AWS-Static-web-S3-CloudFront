variable "project_name" {
  description = "Nombre del proyecto usado para nombrar el Web ACL y sus métricas."
  type        = string
}

variable "tags" {
  description = "Etiquetas adicionales para el Web ACL."
  type        = map(string)
  default     = {}
}
