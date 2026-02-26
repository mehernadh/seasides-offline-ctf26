# Terraform Deployment Guide

Quick steps:

1. **Set up your AWS creds**
   ```bash
   aws configure
   ```
2. **Go to terraform folder**
   ```bash
   cd Web/Blindspot/terraform
   ```
3. **Init**
   ```bash
   terraform init
   ```
4. **Apply**
   ```bash
   terraform apply -auto-approve
   ```
5. **Cleanup**
   ```bash
   terraform destroy -auto-approve
   ```