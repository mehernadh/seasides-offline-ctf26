provider "aws" {
  region = var.region
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

resource "tls_private_key" "deployer" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

data "archive_file" "app_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../app"
  output_path = "${path.module}/app.zip"
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.deployer.key_name

  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  user_data = file("${path.module}/userdata.sh")

  provisioner "file" {
    source      = data.archive_file.app_zip.output_path
    destination = "/home/ubuntu/app.zip"

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = tls_private_key.deployer.private_key_pem
      host        = self.public_ip
    }
  }

  tags = {
    Name = "pwn-instance"
  }
}
