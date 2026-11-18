output "sns_topic_arn" {
  description = "ARN del tópico SNS de alertas."
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_name" {
  description = "Nombre del dashboard de CloudWatch."
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "alarm_names" {
  description = "Alarmas de CloudWatch creadas por el módulo."
  value = [
    aws_cloudwatch_metric_alarm.cloudfront_5xx.alarm_name,
    aws_cloudwatch_metric_alarm.cloudfront_4xx.alarm_name,
    aws_cloudwatch_metric_alarm.s3_assets_5xx.alarm_name,
    aws_cloudwatch_metric_alarm.s3_assets_4xx.alarm_name,
  ]
}
