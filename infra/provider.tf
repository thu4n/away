terraform {
  backend "s3" {
    bucket = "away-tf-state"
    key    = "production/terraform.tfstate"
    region = "auto"

    endpoints = {
      s3 = "https://b78b9fdd13491547180d25a3c9172b30.r2.cloudflarestorage.com"
    }
    # Required for R2 compatibility
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

provider "cloudflare" {
  # API token will be read from CLOUDFLARE_API_TOKEN environment variable
}


