output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.cdn.id
}

output "s3_bucket_name" {
  value = local.bucket_name
}
