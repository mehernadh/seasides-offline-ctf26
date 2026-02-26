variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of the SSH key pair to create/use"
  default     = "project-nebula-key"
}

variable "app_port" {
  description = "Port the application runs on"
  default     = 3000
}
