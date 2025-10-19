# User data script to install k3s and deploy the application
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt-get update
    apt-get upgrade -y
    
    # Install required packages
    apt-get install -y curl git jq
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    
    # Install k3s (lightweight Kubernetes)
    curl -sfL https://get.k3s.io | sh -s - \
      --write-kubeconfig-mode 644 \
      --disable traefik \
      --node-name ticketer-node
    
    # Wait for k3s to be ready
    until kubectl get nodes | grep -q Ready; do
      echo "Waiting for k3s to be ready..."
      sleep 5
    done
    
    # Configure kubectl for ubuntu user
    mkdir -p /home/ubuntu/.kube
    cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
    chown -R ubuntu:ubuntu /home/ubuntu/.kube
    
    # Install Helm
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    
    # Create namespace for ticketer
    kubectl create namespace ticketer || true
    
    # Create MongoDB credentials secret
    kubectl create secret generic mongodb-credentials \
      --from-literal=root-password='${var.mongodb_root_password}' \
      --namespace=ticketer \
      --dry-run=client -o yaml | kubectl apply -f -
    
    # Create application secrets
    kubectl create secret generic app-secrets \
      --from-literal=session-secret='${var.session_secret}' \
      --namespace=ticketer \
      --dry-run=client -o yaml | kubectl apply -f -
    
    # Download and apply Kubernetes manifests
    mkdir -p /home/ubuntu/ticketer-k8s
    cd /home/ubuntu/ticketer-k8s
    
    # Signal completion
    echo "K3s installation complete" > /tmp/k3s-ready
    
    # Save public IP for easy access
    echo $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) > /home/ubuntu/public-ip.txt
    
  EOF
}

# EC2 Instance for K3s
resource "aws_instance" "k3s_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name != "" ? var.key_name : null
  vpc_security_group_ids = [aws_security_group.k3s_server.id]
  subnet_id              = aws_subnet.public.id

  user_data = local.user_data

  root_block_device {
    volume_size           = 20 # GB (free tier allows up to 30GB)
    volume_type           = "gp2"
    delete_on_termination = true
  }

  tags = {
    Name = "${var.project_name}-k3s-server"
  }

  lifecycle {
    create_before_destroy = false
  }
}

# Elastic IP for the instance
resource "aws_eip" "k3s_server" {
  instance = aws_instance.k3s_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

# Null resource to wait for k3s to be ready
resource "null_resource" "wait_for_k3s" {
  depends_on = [aws_instance.k3s_server]

  provisioner "local-exec" {
    command = <<-EOT
      echo "Waiting for K3s to be ready on ${aws_eip.k3s_server.public_ip}..."
      sleep 60
    EOT
  }
}
