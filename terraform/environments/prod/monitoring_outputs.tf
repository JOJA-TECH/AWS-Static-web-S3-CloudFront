output "monitoring_sns_topic_arn" {
  description = "ARN del tópico SNS de monitoreo, si está habilitado."
  value       = var.monitoring_alert_email == null ? null : module.monitoring[0].sns_topic_arn
}

output "monitoring_dashboard_name" {
  description = "Nombre del dashboard de CloudWatch, si está habilitado."
  value       = var.monitoring_alert_email == null ? null : module.monitoring[0].dashboard_name
}

output "monitoring_alarm_names" {
  description = "Nombres de las alarmas de monitoreo, si están habilitadas."
  value       = var.monitoring_alert_email == null ? [] : module.monitoring[0].alarm_names
}
