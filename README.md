# Event Ticketing Platform - Microservices Architecture

A complete event ticketing platform built with microservices architecture, featuring user authentication, event management, ticket booking, and payment processing.

## Architecture Overview

### Microservices
- **Auth Service** (Port 3001): User registration/login with session-based authentication
- **Event Service** (Port 3002): Event creation, listing, and details management
- **Ticket Service** (Port 3003): Ticket availability, booking, and order management
- **Payment Service** (Port 3004): Dummy payment processing with success/failure simulation
- **Frontend** (Port 3000): React.js application with Tailwind CSS

### Tech Stack
- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React.js + Tailwind CSS
- **Communication**: REST APIs between services
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Infrastructure**: AWS EKS via Terraform
- **CI/CD**: GitHub Actions with DevSecOps

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- kubectl
- Terraform
- AWS CLI configured

### Local Development

1. **Clone and setup**
```bash
git clone <repository-url>
cd event-ticketing-platform
```

2. **Start services with Docker Compose**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Auth Service: http://localhost:3001
- Event Service: http://localhost:3002
- Ticket Service: http://localhost:3003
- Payment Service: http://localhost:3004

### Environment Variables

Create `.env` files in each service directory:

**Auth Service (.env)**
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/auth_db
SESSION_SECRET=your-session-secret
NODE_ENV=development
```

**Event Service (.env)**
```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/event_db
AUTH_SERVICE_URL=http://auth-service:3001
NODE_ENV=development
```

**Ticket Service (.env)**
```
PORT=3003
MONGODB_URI=mongodb://localhost:27017/ticket_db
AUTH_SERVICE_URL=http://auth-service:3001
EVENT_SERVICE_URL=http://event-service:3002
NODE_ENV=development
```

**Payment Service (.env)**
```
PORT=3004
MONGODB_URI=mongodb://localhost:27017/payment_db
AUTH_SERVICE_URL=http://auth-service:3001
TICKET_SERVICE_URL=http://ticket-service:3003
NODE_ENV=development
```

**Frontend (.env)**
```
REACT_APP_AUTH_SERVICE_URL=http://localhost:3001
REACT_APP_EVENT_SERVICE_URL=http://localhost:3002
REACT_APP_TICKET_SERVICE_URL=http://localhost:3003
REACT_APP_PAYMENT_SERVICE_URL=http://localhost:3004
```

## Deployment

### AWS Infrastructure with Terraform

1. **Initialize Terraform**
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

2. **Deploy to Kubernetes**
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name event-ticketing-cluster

# Apply Kubernetes manifests
kubectl apply -f k8s/
```

### CI/CD Pipeline

The GitHub Actions pipeline automatically:
- Runs security scans (SAST with CodeQL)
- Builds and tests all services
- Scans Docker images with Trivy
- Pushes images to GitHub Container Registry
- Deploys to EKS cluster

## API Documentation

### Auth Service Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify session (internal)

### Event Service Endpoints
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)

### Ticket Service Endpoints
- `GET /api/tickets/event/:eventId` - Get available tickets for event
- `POST /api/tickets/book` - Book tickets
- `GET /api/tickets/orders` - Get user's orders
- `GET /api/tickets/orders/:id` - Get order details

### Payment Service Endpoints
- `POST /api/payment/process` - Process payment
- `GET /api/payment/status/:orderId` - Get payment status

## Security Features

- Session-based authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers
- Container image vulnerability scanning
- Static Application Security Testing (SAST)

## Monitoring & Logging

- Structured logging with Winston
- Health check endpoints
- Prometheus metrics (ready for integration)
- Request/response logging middleware

## Development

### Running Individual Services

Each service can be run independently:

```bash
cd auth
npm install
npm run dev

cd ../event
npm install
npm run dev

# ... repeat for other services
```

### Testing

```bash
# Run tests for all services
npm run test:all

# Run tests for specific service
cd auth
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run security scans
6. Submit a pull request

## License

MIT License - see LICENSE file for details
