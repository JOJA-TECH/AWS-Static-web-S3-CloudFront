terraform {
  # El backend no admite variables: el bucket se pasa con -backend-config.
  backend "s3" {
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
