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
