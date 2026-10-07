output "alias_a_fqdns" {
  description = "FQDNs de los registros alias A creados."
  value       = [for record in aws_route53_record.alias_a : record.fqdn]
}

output "alias_aaaa_fqdns" {
  description = "FQDNs de los registros alias AAAA creados."
  value       = [for record in aws_route53_record.alias_aaaa : record.fqdn]
}

output "record_fqdns" {
  description = "FQDNs de todos los registros alias creados (A y AAAA)."
  value       = concat([for record in aws_route53_record.alias_a : record.fqdn], [for record in aws_route53_record.alias_aaaa : record.fqdn])
}
