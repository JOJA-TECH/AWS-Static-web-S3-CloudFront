terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

############################
# 1. Registros alias A
############################
# Alias A hacia el destino (la distribución CloudFront) para cada nombre
# indicado. No se crean Hosted Zones: la zona debe existir.
resource "aws_route53_record" "alias_a" {
  for_each = toset(var.record_names)

  zone_id = var.zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = var.target_dns_name
    zone_id                = var.target_zone_id
    evaluate_target_health = false
  }
}

############################
# 2. Registros alias AAAA
############################
# Equivalentes IPv6, solo si el destino (CloudFront) sirve IPv6.
resource "aws_route53_record" "alias_aaaa" {
  for_each = var.create_aaaa_records ? toset(var.record_names) : toset([])

  zone_id = var.zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = var.target_dns_name
    zone_id                = var.target_zone_id
    evaluate_target_health = false
  }
}
