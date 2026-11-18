# API REST mínima (Lambda + API Gateway HTTP API) que expone datos reales
# del bucket de activos al frontend sin credenciales de AWS en el navegador.

resource "aws_iam_role" "lambda" {
  name               = "api-lambda-${var.bucket_name}"
  path               = "/service-role/"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = "object-storage"
    Managed = "terraform"
  }
}

resource "aws_iam_role_policy" "s3_read" {
  name   = "api-lambda-s3-read"
  role   = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action = [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:GetObjectTagging",
        "s3:PutObject",
        "s3:PutObjectTagging"
      ]
      Resource = [
        var.bucket_arn,
        "${var.bucket_arn}/*"
      ]
    }]
  })
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = path.module
  output_path = "${path.module}/api_lambda.zip"
}

resource "aws_lambda_function" "api" {
  function_name = "api-object-storage-${var.bucket_name}"
  role          = aws_iam_role.lambda.arn
  runtime       = "python3.12"
  handler       = "lambda_function.lambda_handler"
  timeout       = 30
  memory_size   = 256
  package_type  = "Zip"

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME = var.bucket_name
      ALLOWED_ORIGIN = var.allowed_origin
    }
  }

  tags = {
    Project = "object-storage"
    Managed = "terraform"
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = "api-object-storage-${var.bucket_name}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins   = [var.allowed_origin]
    allow_methods   = ["GET", "OPTIONS"]
    allow_headers   = ["content-type"]
    max_age = 300
    allow_credentials = false
  }

  tags = {
    Project = "object-storage"
    Managed = "terraform"
  }
}

resource "aws_apigatewayv2_integration" "api" {
  api_id            = aws_apigatewayv2_api.api.id
  integration_type  = "AWS_PROXY"
  integration_uri   = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "files" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/files"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "files_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /api/files"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "stats" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /api/stats"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "stats_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /api/stats"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "upload_url" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/upload/url"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "upload_url_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /api/upload/url"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "upload_complete" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /api/upload/complete"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_route" "upload_complete_options" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "OPTIONS /api/upload/complete"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "api" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "prod"
  auto_deploy = true

  tags = {
    Project = "object-storage"
    Managed = "terraform"
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "allow-apigateway-invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
