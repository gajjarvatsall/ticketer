# General Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1" # Free tier eligible
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ticketer"
}

# EC2 Instance Variables
variable "instance_type" {
  description = "EC2 instance type (t3.small recommended for MongoDB + services, free tier eligible for 12 months)"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
  default     = ""
}

# Networking Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed to SSH into instances"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

# Application Variables
variable "mongodb_root_password" {
  description = "MongoDB root password"
  type        = string
  sensitive   = true
  default     = "change-me-in-production"
}

variable "session_secret" {
  description = "Session secret for auth service"
  type        = string
  sensitive   = true
  default     = "change-me-in-production"
}

# Docker Registry Variables
variable "docker_registry" {
  description = "Docker registry URL (Docker Hub or ECR)"
  type        = string
  default     = "ghcr.io" # GitHub Container Registry
}

variable "docker_registry_username" {
  description = "Docker registry username"
  type        = string
  default     = ""
}

variable "docker_registry_password" {
  description = "Docker registry password or token"
  type        = string
  sensitive   = true
  default     = ""
}

# Domain Variables (optional)
variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

variable "enable_https" {
  description = "Enable HTTPS with Let's Encrypt"
  type        = bool
  default     = false
}
