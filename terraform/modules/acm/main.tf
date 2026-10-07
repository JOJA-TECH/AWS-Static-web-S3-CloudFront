terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

############################
# 1. Certificado ACM
############################
# Los certificados usados por CloudFront deben emitirse en us-east-1: este
# módulo se invoca siempre con el provider aws.us_east_1.
resource "aws_acm_certificate" "this" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  validation_method         = "DNS"
  subject_alternative_names = var.subject_alternative_names

  tags = var.tags

  # Mantiene el certificado nuevo operativo antes de destruir el anterior.
  lifecycle {
    create_before_destroy = true
  }
}

############################
# 2. Registros CNAME de validación
############################
# Un registro por dominio (principal y SANs) en la zona Route 53 indicada,
# generados con for_each sobre domain_validation_options.
resource "aws_route53_record" "validation" {
  provider = aws.us_east_1

  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = var.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = var.validation_record_ttl
  allow_overwrite = true
}

############################
# 3. Espera de emisión
############################
# Bloquea el despliegue hasta que el certificado quede en estado ISSUED.
resource "aws_acm_certificate_validation" "this" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}
