provider "aws" {
  region = var.aws_region

  # Etiquetas por defecto aplicadas a todos los recursos del ambiente.
  default_tags {
    tags = local.common_tags
  }

  # La autenticación NO se declara aquí: se resuelve mediante el entorno de
  # ejecución (perfil de AWS CLI, variables de entorno AWS_* o rol de IAM),
  # sin incluir claves ni secretos en el código.
}
