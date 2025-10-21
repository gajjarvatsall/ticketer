# User data script to install k3s and deploy the application
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update system
    apt-get update
    apt-get upgrade -y

    # Install required packages
    apt-get install -y curl git jq ca-certificates snapd

    # Add 1G swap to help on t2.micro (1GB RAM)
    if [ ! -f /swapfile ]; then
      fallocate -l 1G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1024
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi

    # Wait for stable public IP (handles Elastic IP association)
    STABLE_COUNT=0
    LAST_IP=""
    for i in $(seq 1 60); do
      CUR_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || true)
      if [ -n "$CUR_IP" ] && [ "$CUR_IP" = "$LAST_IP" ]; then
        STABLE_COUNT=$((STABLE_COUNT+1))
      else
        STABLE_COUNT=0
      fi
      LAST_IP="$CUR_IP"
      if [ $STABLE_COUNT -ge 6 ]; then
        break
      fi
      sleep 5
    done
    PUBLIC_IP="$LAST_IP"

    echo "[user-data] Installing MicroK8s with PUBLIC_IP=$PUBLIC_IP" | tee -a /var/log/user-data.log
    snap install microk8s --classic --channel=1.29/stable
    usermod -aG microk8s ubuntu
    mkdir -p /home/ubuntu/.kube
    chown -R ubuntu:ubuntu /home/ubuntu/.kube

    echo "[user-data] Waiting for MicroK8s to be ready" | tee -a /var/log/user-data.log
    microk8s status --wait-ready

    # Enable essential addons
    microk8s enable dns storage
    # Optional ingress if you want to use Ingress instead of NodePort
    microk8s enable ingress || true

    # Generate kubeconfig for ubuntu user
    microk8s config > /home/ubuntu/.kube/config
    chown -R ubuntu:ubuntu /home/ubuntu/.kube

    # Save public IP for easy access
    echo "$PUBLIC_IP" > /home/ubuntu/public-ip.txt

    echo "MicroK8s installation complete" | tee -a /var/log/user-data.log
    echo "ready" > /tmp/microk8s-ready
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

# Null resource to wait for MicroK8s to be ready (basic grace period)
resource "null_resource" "wait_for_microk8s" {
  depends_on = [aws_instance.k3s_server]

  provisioner "local-exec" {
    command = <<-EOT
      echo "Waiting for MicroK8s to be ready on ${aws_eip.k3s_server.public_ip}..."
      sleep 60
    EOT
  }
}
