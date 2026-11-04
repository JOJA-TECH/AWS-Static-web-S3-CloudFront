output "function_name" {
  description = "Nombre de la funcion Lambda@Edge."
  value       = aws_lambda_function.edge.function_name
}

output "function_arn" {
  description = "ARN de la funcion Lambda@Edge (sin version)."
  value       = aws_lambda_function.edge.arn
}

output "qualified_arn" {
  description = "ARN cualificado de la version publicada de la funcion Lambda@Edge."
  value       = aws_lambda_function.edge.qualified_arn
}

output "lambda_version" {
  description = "Numero de la version publicada de la funcion Lambda@Edge."
  value       = aws_lambda_function.edge.version
}

output "role_arn" {
  description = "ARN del rol IAM de la funcion Lambda@Edge."
  value       = aws_iam_role.edge.arn
}
