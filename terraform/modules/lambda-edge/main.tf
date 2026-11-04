terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

############################
# 1. Rol de IAM para Lambda@Edge
############################

resource "aws_iam_role" "edge" {
  name               = "${var.project_name}-lambda-edge"
  assume_role_policy = data.aws_iam_policy_document.lambda_edge_trust.json
  path               = "/service-role/"
  description        = "Rol exclusivo para la funcion Lambda@Edge que agrega encabezados de seguridad en origin-response."

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_edge_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
    }
  }
}

############################
# 2. Archivo ZIP de la funcion
############################

# Se empaqueta solo el archivo de produccion (src/index.js). No se incluyen
# tests ni credenciales.
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda-edge-function.zip"
  source {
    content  = file("${path.module}/src/index.js")
    filename = "index.js"
  }
}

############################
# 3. Funcion Lambda en us-east-1
############################

resource "aws_lambda_function" "edge" {
  provider         = aws.us_east_1
  function_name    = "${var.project_name}-lambda-edge-security-headers"
  role             = aws_iam_role.edge.arn
  runtime          = var.runtime
  handler          = "index.handler"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip.output_path)
  publish          = true
  description      = "Lambda@Edge: agrega encabezados de seguridad HTTP en respuestas origin-response de CloudFront."
  timeout          = 30

  tags = var.tags

  lifecycle {
    # Forzar actualizacion de la version publicada cuando el codigo cambia.
    ignore_changes = []
  }
}

############################
# 4. Permiso de invocacion de CloudFront
############################

# CloudFront necesita permiso para invocar la version publicada de la funcion.
resource "aws_lambda_permission" "cloudfront" {
  statement_id   = "AllowCloudFrontInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.edge.qualified_arn
  principal      = "cloudfront.amazonaws.com"
  source_arn     = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:*"
  source_account = data.aws_caller_identity.current.account_id
}

data "aws_caller_identity" "current" {}