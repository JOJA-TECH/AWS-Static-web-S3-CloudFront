terraform {
  # El backend no admite variables: bucket y tabla de lock se pasan con
  # -backend-config desde los workflows.
  backend "s3" {
    key     = "prod/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
