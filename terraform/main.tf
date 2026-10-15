terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.6.0"
}

provider "aws" {
  region = "ap-south-1"
}
resource "aws_dynamodb_table" "complaints" {
  name         = "college-complaints"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "complaint_id"

  attribute {
    name = "complaint_id"
    type = "S"
  }

  tags = {
    Project = "Serverless College Complaint Management System"
  }
}
resource "aws_iam_role" "lambda_role" {
  name = "college-complaint-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Project = "Serverless College Complaint Management System"
  }
}
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
resource "aws_lambda_function" "complaint_function" {
  function_name = "college-complaint-function"
  role          = aws_iam_role.lambda_role.arn

  filename         = "lambda/lambda_function.zip"
  source_code_hash = filebase64sha256("lambda/lambda_function.zip")

  handler = "index.lambda_handler"
  runtime = "python3.12"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.complaints.name
    }
  }

  tags = {
    Project = "Serverless College Complaint Management System"
  }
}
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "college-complaint-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]

        Resource = aws_dynamodb_table.complaints.arn
      }
    ]
  })
}
resource "aws_apigatewayv2_api" "complaint_api" {
  name          = "college-complaint-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "PUT", "OPTIONS"]
    allow_headers = ["content-type"]
  }


  tags = {
    Project = "Serverless College Complaint Management System"
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.complaint_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.complaint_function.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "submit_complaint" {
  api_id    = aws_apigatewayv2_api.complaint_api.id
  route_key = "POST /complaints"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "track_complaint" {
  api_id    = aws_apigatewayv2_api.complaint_api.id
  route_key = "GET /complaints/{complaint_id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "update_complaint" {
  api_id    = aws_apigatewayv2_api.complaint_api.id
  route_key = "PUT /complaints/{complaint_id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_route" "list_complaints" {
  api_id    = aws_apigatewayv2_api.complaint_api.id
  route_key = "GET /complaints"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.complaint_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.complaint_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.complaint_api.execution_arn}/*/*"
}
output "api_endpoint" {
  value = aws_apigatewayv2_stage.default.invoke_url
}
