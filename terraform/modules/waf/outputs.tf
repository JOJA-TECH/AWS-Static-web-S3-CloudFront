output "web_acl_arn" {
  description = "ARN del Web ACL de CloudFront."
  value       = aws_wafv2_web_acl.this.arn
}
