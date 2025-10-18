# Environment variables for running services locally (without Docker)

# Copy the appropriate .env file for each service when running without Docker

# For local development (without Docker), update MongoDB URIs to:

# MONGODB_URI=mongodb://localhost:27017/<db_name>

# Use these ports for local MongoDB instances:

# Auth: mongodb://localhost:27017/auth_db

# Event: mongodb://localhost:27018/event_db (if running separate instance)

# Ticket: mongodb://localhost:27019/ticket_db (if running separate instance)

# Payment: mongodb://localhost:27020/payment_db (if running separate instance)

# OR use a single MongoDB instance with different database names:

# All services: mongodb://localhost:27017/<service_name>\_db
