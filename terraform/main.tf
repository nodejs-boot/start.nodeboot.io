terraform {
  backend "s3" {
    bucket = "nodeboot-start-tf-state"
    key    = "nodeboot-start-landing.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "eu-central-1"
}

locals {
  region        = "eu-central-1"
  bucket_name   = "nodeboot-start-website"
  domain_name   = "start.nodeboot.io"
}

##########################
# S3 Bucket Setup
##########################

resource "aws_s3_bucket" "website" {
  bucket        = local.bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.website.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "public_block" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # For SPA routing
  }
}

##########################
# S3 Access Policy for CloudFront (OAC)
##########################

resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "nodeboot-start-oac"
  description                       = "Access to S3 from CloudFront"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "cloudfront_access" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.website.arn}/*"
    ]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.website.id
  policy = data.aws_iam_policy_document.cloudfront_access.json
}

##########################
# CloudFront Distribution
##########################

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = local.bucket_name
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "SPA for nodeboot start"
  default_root_object = "index.html"
  aliases             = [local.domain_name]

  default_cache_behavior {
    target_origin_id       = local.bucket_name
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn            = "arn:aws:acm:us-east-1:139161573003:certificate/cb7295c6-7077-4d02-9493-1a4b72756b25"
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = false
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  depends_on = [
    aws_s3_bucket.website,
    aws_cloudfront_origin_access_control.oac
  ]
}

##########################
# Optional: Response Security Headers
##########################

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "start-Security-Headers"

  security_headers_config {

    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    xss_protection {
      protection = true
      mode_block = true
      override   = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}

##########################
# Route 53 DNS Record
##########################

data "aws_route53_zone" "primary" {
  name = "nodeboot.io"
}

resource "aws_route53_record" "start" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = "start"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = true
  }
}
