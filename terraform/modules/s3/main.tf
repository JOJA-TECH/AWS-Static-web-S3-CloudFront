terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

locals {
  tags = merge(
    var.tags,
    var.purpose == null ? {} : { Purpose = var.purpose },
  )
}

# checkov:skip=CKV_AWS_145:Cifrado SSE-S3 suficiente para este entorno (KMS opcional futuro)
# checkov:skip=CKV_AWS_18:Access logging se centraliza en el bucket de logs
# checkov:skip=CKV2_AWS_62:Event notifications no requeridas por la aplicacion
# checkov:skip=CKV_AWS_144:Replicacion cross-region no requerida (unico ambiente)
resource "aws_s3_bucket" "this" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy

  tags = local.tags
}

# Propiedad de objetos: BucketOwnerEnforced deshabilita las ACL y garantiza
# que el propietario del bucket sea dueño de todos los objetos cargados.
# Cuando se habilita CloudFront logging, se usa BucketOwnerPreferred para
# permitir que CloudFront escriba objetos mediante ACL.
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    object_ownership = var.enable_cloudfront_logging ? "BucketOwnerPreferred" : "BucketOwnerEnforced"
  }
}

# ACL para entrega de logs de CloudFront: concede escritura al servicio
# LogDelivery de S3 solo cuando el bucket es destino de logs de CloudFront.
resource "aws_s3_bucket_acl" "cloudfront_logs" {
  count = var.enable_cloudfront_logging ? 1 : 0

  bucket = aws_s3_bucket.this.id
  acl    = "log-delivery-write"

  depends_on = [aws_s3_bucket_ownership_controls.this]
}

# Bloqueo completo de todo acceso público al bucket.
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cifrado del lado del servidor: SSE-S3 por defecto, SSE-KMS opcional.
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.sse_algorithm
      kms_master_key_id = var.kms_master_key_id
    }

    bucket_key_enabled = var.sse_algorithm == "aws:kms"
  }
}

# Versionado para recuperar versiones anteriores de los objetos.
resource "aws_s3_bucket_versioning" "this" {
  count = var.versioning ? 1 : 0

  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Reglas de ciclo de vida opcionales: transición de clases de almacenamiento y
# expiración de versiones actuales y no actuales.
# checkov:skip=CKV_AWS_300:Periodo de aborto de subidas fallidas se revisara en etapa posterior
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  count = length(var.lifecycle_rules) > 0 ? 1 : 0

  bucket = aws_s3_bucket.this.id

  dynamic "rule" {
    for_each = var.lifecycle_rules

    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      filter {}

      dynamic "transition" {
        for_each = rule.value.transitions

        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days == null ? [] : [rule.value.expiration_days]

        content {
          days = expiration.value
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration_days == null ? [] : [rule.value.noncurrent_version_expiration_days]

        content {
          noncurrent_days = noncurrent_version_expiration.value
        }
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.this]
}
