variable "bucket_name" {
  description = "Nombre globalmente único del bucket S3."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "El nombre del bucket debe tener entre 3 y 63 caracteres, solo minúsculas, números y guiones."
  }
}

variable "purpose" {
  description = "Propósito del bucket (ej. assets, uploads, logs). Se aplica como etiqueta Purpose."
  type        = string
  default     = null
}

variable "tags" {
  description = "Etiquetas adicionales para el bucket."
  type        = map(string)
  default     = {}
}

variable "versioning" {
  description = "Habilita el versionado de objetos para facilitar la recuperación de versiones anteriores."
  type        = bool
  default     = true
}

variable "sse_algorithm" {
  description = "Algoritmo de cifrado del lado del servidor: AES256 (SSE-S3) o aws:kms (SSE-KMS)."
  type        = string
  default     = "AES256"

  validation {
    condition     = contains(["AES256", "aws:kms"], var.sse_algorithm)
    error_message = "sse_algorithm debe ser \"AES256\" o \"aws:kms\"."
  }

  validation {
    condition     = var.sse_algorithm != "aws:kms" || var.kms_master_key_id != null
    error_message = "Si sse_algorithm es \"aws:kms\", debe definirse kms_master_key_id."
  }
}

variable "kms_master_key_id" {
  description = "ID o ARN de la clave KMS para el cifrado SSE-KMS. Requerido solo si sse_algorithm es \"aws:kms\"."
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Permite eliminar el bucket aunque contenga objetos. Mantener en false salvo necesidad explícita."
  type        = bool
  default     = false
}

variable "lifecycle_rules" {
  description = "Reglas de ciclo de vida opcionales para controlar retención y costos."

  type = list(object({
    id     = string
    enabled = optional(bool, true)
    prefix  = optional(string)

    transitions = optional(list(object({
      days          = number
      storage_class = string
    })), [])

    expiration_days                    = optional(number)
    noncurrent_version_expiration_days = optional(number)
  }))

  default = []

  validation {
    condition = alltrue([
      for rule in var.lifecycle_rules :
      length(rule.transitions) > 0 ||
      rule.expiration_days != null ||
      rule.noncurrent_version_expiration_days != null
    ])

    error_message = "Cada regla de ciclo de vida debe definir al menos una acción."
  }

  validation {
    condition = alltrue([
      for rule in var.lifecycle_rules :
      alltrue([
        for transition in rule.transitions :
        contains([
          "STANDARD_IA",
          "ONEZONE_IA",
          "GLACIER",
          "GLACIER_IR",
          "DEEP_ARCHIVE"
        ], transition.storage_class)
      ])
    ])

    error_message = "La clase de almacenamiento indicada no es válida para una transición."
  }
}
