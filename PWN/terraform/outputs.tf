output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "app_url" {
  description = "URL of the BlindSpot Application"
  value       = "http://${aws_instance.web.public_ip}"
}
