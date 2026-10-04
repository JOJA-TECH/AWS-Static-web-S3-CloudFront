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
