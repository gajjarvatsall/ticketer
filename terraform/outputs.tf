output "instance_public_ip" {
  description = "Public IP address of the K3s server"
  value       = aws_eip.k3s_server.public_ip
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.k3s_server.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.k3s_server.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = var.key_name != "" ? "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_eip.k3s_server.public_ip}" : "No key pair configured"
}

output "kubeconfig_command" {
  description = "Command to get kubeconfig"
  value       = var.key_name != "" ? "scp -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_eip.k3s_server.public_ip}:/home/ubuntu/.kube/config ./kubeconfig" : "No key pair configured"
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.k3s_server.public_ip}"
}

output "dashboard_url" {
  description = "URL for Kubernetes dashboard (if installed)"
  value       = "http://${aws_eip.k3s_server.public_ip}:30000"
}
