variable "project_name" {
  description = "Nombre corto del proyecto, usado para nombrar recursos y etiquetas."
  type        = string
  default     = "object-storage"
}

variable "runtime" {
  description = "Runtime de Lambda (debe ser compatible con Node.js y el formato del handler)."
  type        = string
  default     = "nodejs20.x"
}

variable "tags" {
  description = "Etiquetas adicionales para los recursos de Lambda@Edge."
  type        = map(string)
  default     = {}
}
