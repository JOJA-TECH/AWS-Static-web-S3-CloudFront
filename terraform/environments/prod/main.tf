# Configuración principal del ambiente prod.

locals {
  environment = "prod"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "terraform"
  }

  bucket_prefix = coalesce(var.bucket_name_prefix, var.project_name)

  bucket_names = {
    activos = "${local.bucket_prefix}-${local.environment}-activos"
    cargas  = "${local.bucket_prefix}-${local.environment}-cargas"
    logs    = "${local.bucket_prefix}-${local.environment}-logs"
  }

  # Dominio personalizado: se activa al definir domain_name; sin dominio,
  # CloudFront sigue usando su dominio y certificado por defecto.
  custom_domain_enabled = var.domain_name != null

  # Aliases de CloudFront: dominio principal más dominios alternativos.
  domain_aliases = local.custom_domain_enabled ? concat([var.domain_name], var.domain_subject_alternative_names) : []

  # Nombre de la Hosted Zone: la zona del dominio padre (p. ej. joja.click)
  # cuando el sitio vive en un subdominio (p. ej. infra.joja.click).
  hosted_zone_name = coalesce(var.route53_zone_name, var.domain_name)

  # Zona Route 53 pública: se crea una nueva, se usa un zone_id directo o se
  # busca una existente por nombre.
  route53_zone_id = local.custom_domain_enabled ? (
    var.create_route53_zone ? aws_route53_zone.this[0].zone_id : (
      var.route53_zone_id != null ? var.route53_zone_id : data.aws_route53_zone.selected[0].zone_id
    )
  ) : null
}

# Hosted Zone pública existente: se consulta solo cuando no se crea una nueva,
# no se indica route53_zone_id y se proporciona route53_zone_name.
data "aws_route53_zone" "selected" {
  count = !var.create_route53_zone && var.route53_zone_id == null && var.route53_zone_name != null ? 1 : 0

  name         = var.route53_zone_name
  private_zone = false
}

# Hosted Zone pública nueva para el dominio (padre). Tras crearla hay que
# copiar sus name servers en el registrador del dominio para que ACM pueda
# validar el certificado.
resource "aws_route53_zone" "this" {
  count = local.custom_domain_enabled && var.create_route53_zone ? 1 : 0

  name    = local.hosted_zone_name
  comment = "Hosted Zone publica para ${local.hosted_zone_name}"

  tags = local.common_tags

  # La Hosted Zone es la delegación del dominio en Route 53 y sobrevive a los
  # despliegues: no se destruye con terraform destroy. Si de verdad quieres
  # recrearla, comenta este bloque temporalmente.
  lifecycle {
    prevent_destroy = true
  }
}

# Buckets del ambiente: contenido estático, cargas de usuarios y logs. Todos
# quedan privados, con cifrado, versionado y acceso público bloqueado.
module "s3_activos" {
  source = "../../modules/s3"

  bucket_name = local.bucket_names.activos
  purpose     = "activos"

  lifecycle_rules = [
    {
      id      = "storage-optimization"
      enabled = true

      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]

      expiration_days = 365
    }
  ]
}

module "s3_cargas" {
  source = "../../modules/s3"

  bucket_name = local.bucket_names.cargas
  purpose     = "cargas"
}

module "s3_logs" {
  source = "../../modules/s3"

  bucket_name = local.bucket_names.logs
  purpose     = "logs"
}

# Certificado ACM en us-east-1 con validación DNS en la zona indicada.
module "acm" {
  count  = local.custom_domain_enabled ? 1 : 0
  source = "../../modules/acm"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  domain_name               = var.domain_name
  subject_alternative_names = var.domain_subject_alternative_names
  zone_id                   = local.route53_zone_id
  validation_record_ttl     = var.route53_validation_record_ttl

  tags = local.common_tags
}

############################
# Lambda@Edge: encabezados de seguridad en origin-response
############################
# La función se crea en us-east-1 (requisito de Lambda@Edge) usando el provider
# alias aws.us_east_1. Se publica como una version inmutable y CloudFront usa
# su ARN cualificado. No depende de ACM, Route 53 ni de un dominio personalizado.
module "lambda_edge" {
  source = "../../modules/lambda-edge"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  project_name = var.project_name
  tags         = local.common_tags
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  project_name                = var.project_name
  bucket_id                   = module.s3_activos.bucket_name
  bucket_arn                  = module.s3_activos.bucket_arn
  bucket_regional_domain_name = module.s3_activos.bucket_regional_domain_name

  # Dominio personalizado: aliases de CloudFront y certificado ACM (null usa el
  # certificado por defecto de CloudFront).
  aliases             = local.domain_aliases
  acm_certificate_arn = local.custom_domain_enabled ? module.acm[0].certificate_arn : null

  # ARN cualificado de la version publicada de Lambda@Edge para agregar
  # encabezados de seguridad en origin-response. Null si no se desea asociar.
  lambda_edge_qualified_arn = module.lambda_edge.qualified_arn

  tags = local.common_tags
}

# Registros alias A/AAAA en la zona Route 53 existente, apuntando a la
# distribución de CloudFront.
module "route53" {
  count  = local.custom_domain_enabled ? 1 : 0
  source = "../../modules/route53"

  zone_id             = local.route53_zone_id
  record_names        = local.domain_aliases
  target_dns_name     = module.cloudfront.distribution_domain_name
  target_zone_id      = module.cloudfront.distribution_hosted_zone_id
  create_aaaa_records = module.cloudfront.is_ipv6_enabled
}
