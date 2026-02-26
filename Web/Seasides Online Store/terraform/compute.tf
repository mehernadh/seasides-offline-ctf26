resource "tls_private_key" "deployer" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "deployer" {
  key_name   = var.key_name
  public_key = tls_private_key.deployer.public_key_openssh
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}



resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.deployer.key_name
  subnet_id     = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              # Update and Install Docker
              apt-get update
              apt-get install -y docker.io

              # Start Docker
              systemctl start docker
              systemctl enable docker

              # Pull and Run Container
              docker pull mehernadh/seasides-online-store
              docker run -d -p 5000:4000 --restart always --name seasides-online-store mehernadh/seasides-online-store
              EOF

  tags = {
    Name = "seasides-online-store-instance"
  }
}

