output "api_endpoint" {
  description = "URL base de la API Gateway HTTP API."
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_id" {
  description = "ID de la API Gateway HTTP API."
  value       = aws_apigatewayv2_api.api.id
}
