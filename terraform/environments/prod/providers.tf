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

# Provider fijo en us-east-1 para recursos globales que lo exigen: ACM requiere
# que los certificados usados por CloudFront se emitan en esa región, aunque el
# provider principal (var.aws_region) apunte a otra.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = local.common_tags
  }
}
