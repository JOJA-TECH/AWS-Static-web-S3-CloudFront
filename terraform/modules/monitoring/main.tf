resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-monitoring-alerts"
  tags = var.tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_s3_bucket_metric" "assets" {
  bucket = var.assets_bucket_name
  name   = "EntireBucket"
}

resource "aws_s3_bucket_metric" "uploads" {
  bucket = var.uploads_bucket_name
  name   = "EntireBucket"
}

resource "aws_s3_bucket_metric" "logs" {
  bucket = var.logs_bucket_name
  name   = "EntireBucket"
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-cloudfront-5xx"
  alarm_description   = "Tasa elevada de errores 5xx en CloudFront."
  namespace           = "AWS/CloudFront"
  metric_name         = "5xxErrorRate"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = var.tags
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx" {
  alarm_name          = "${var.project_name}-${var.environment}-cloudfront-4xx"
  alarm_description   = "Tasa elevada de errores 4xx en CloudFront."
  namespace           = "AWS/CloudFront"
  metric_name         = "4xxErrorRate"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 10
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = var.cloudfront_distribution_id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = var.tags
}

resource "aws_cloudwatch_metric_alarm" "s3_assets_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-s3-assets-5xx"
  alarm_description   = "Errores 5xx en el bucket de activos."
  namespace           = "AWS/S3"
  metric_name         = "5xxErrors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    BucketName = var.assets_bucket_name
    FilterId   = "EntireBucket"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = var.tags
}

resource "aws_cloudwatch_metric_alarm" "s3_assets_4xx" {
  alarm_name          = "${var.project_name}-${var.environment}-s3-assets-4xx"
  alarm_description   = "Errores 4xx elevados en el bucket de activos."
  namespace           = "AWS/S3"
  metric_name         = "4xxErrors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 10
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    BucketName = var.assets_bucket_name
    FilterId   = "EntireBucket"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  tags          = var.tags
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Solicitudes CloudFront"
          region = "us-east-1"
          stat   = "Sum"
          period = 300
          view   = "timeSeries"
          metrics = [[
            "AWS/CloudFront", "Requests",
            "DistributionId", var.cloudfront_distribution_id,
            "Region", "Global"
          ]]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Errores CloudFront"
          region = "us-east-1"
          stat   = "Average"
          period = 300
          view   = "timeSeries"
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global"],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global"]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Bytes descargados por CloudFront"
          region = "us-east-1"
          stat   = "Sum"
          period = 300
          view   = "timeSeries"
          metrics = [[
            "AWS/CloudFront", "BytesDownloaded",
            "DistributionId", var.cloudfront_distribution_id,
            "Region", "Global"
          ]]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Solicitudes y errores S3 - activos"
          region = "us-east-1"
          stat   = "Sum"
          period = 300
          view   = "timeSeries"
          metrics = [
            ["AWS/S3", "AllRequests", "BucketName", var.assets_bucket_name, "FilterId", "EntireBucket"],
            ["AWS/S3", "4xxErrors", "BucketName", var.assets_bucket_name, "FilterId", "EntireBucket"],
            ["AWS/S3", "5xxErrors", "BucketName", var.assets_bucket_name, "FilterId", "EntireBucket"]
          ]
        }
      }
    ]
  })
}
