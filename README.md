# Ticketer - Event Ticketing Platform# Event Ticketing Platform - Microservices Architecture

A full-stack event ticketing platform built with microservices architecture. This application allows users to create events, browse available events, and book tickets seamlessly.A complete event ticketing platform built with microservices architecture, featuring user authentication, event management, ticket booking, and payment processing.

## 🏗️ Architecture## Architecture Overview

This project follows a **microservices architecture** with the following services:### Microservices

- **Auth Service** (Port 3001): User registration/login with session-based authentication

### Backend Microservices (Node.js + Express + MongoDB)- **Event Service** (Port 3002): Event creation, listing, and details management

- **Ticket Service** (Port 3003): Ticket availability, booking, and order management

1. **Auth Service** (Port 3001)- **Payment Service** (Port 3004): Dummy payment processing with success/failure simulation
   - User authentication and session management- **Frontend** (Port 3000): React.js application with Tailwind CSS

   - Registration, login, logout functionality

   - Session validation for other services### Tech Stack

- **Backend**: Node.js + Express.js + MongoDB

2. **Event Service** (Port 3002)- **Frontend**: React.js + Tailwind CSS
   - Event creation and management- **Communication**: REST APIs between services

   - Event listing and filtering by category- **Containerization**: Docker

   - Event retrieval by ID- **Orchestration**: Kubernetes

- **Infrastructure**: AWS EKS via Terraform

3. **Ticket Service** (Port 3003)- **CI/CD**: GitHub Actions with DevSecOps
   - Ticket booking and order management

   - Order creation and tracking## Quick Start

   - Customer information handling

### Prerequisites

4. **Payment Service** (Port 3004)- Node.js 18+
   - Payment processing (simulated)- Docker & Docker Compose

   - Payment history tracking- kubectl

   - Integration with ticket orders- Terraform

- AWS CLI configured

### Frontend (React + TypeScript + Vite)

### Local Development

- Modern React application with TypeScript

- Responsive UI built with Tailwind CSS1. **Clone and setup**

- Direct API communication with backend microservices```bash

- No external dependencies like Convexgit clone <repository-url>

cd event-ticketing-platform

## 📋 Features```

- ✅ User authentication (register, login, logout)2. **Start services with Docker Compose**

- ✅ Create and manage events```bash

- ✅ Browse events with category filteringdocker-compose up -d

- ✅ Book tickets for events```

- ✅ View booking history

- ✅ Responsive design3. **Access the application**

- ✅ Session-based authentication- Frontend: http://localhost:3000

- ✅ RESTful API architecture- Auth Service: http://localhost:3001

- Event Service: http://localhost:3002

## 🚀 Quick Start- Ticket Service: http://localhost:3003

- Payment Service: http://localhost:3004

### Prerequisites

### Environment Variables

- Node.js (v18 or higher)

- MongoDB (v4.4 or higher)Create `.env` files in each service directory:

- npm or yarn

**Auth Service (.env)**

### Installation```

PORT=3001

1. **Clone the repository**MONGODB_URI=mongodb://localhost:27017/auth_db

   ````bashSESSION_SECRET=your-session-secret

   git clone <repository-url>NODE_ENV=development

   cd ticketer```

   ````

**Event Service (.env)**

2. **Install dependencies**```

PORT=3002

For frontend:MONGODB_URI=mongodb://localhost:27017/event_db

```bashAUTH_SERVICE_URL=http://auth-service:3001

npm installNODE_ENV=development

```

For each microservice:**Ticket Service (.env)**

`bash`

cd auth && npm install && cd ..PORT=3003

cd event && npm install && cd ..MONGODB_URI=mongodb://localhost:27017/ticket_db

cd ticket && npm install && cd ..AUTH_SERVICE_URL=http://auth-service:3001

cd payment && npm install && cd ..EVENT_SERVICE_URL=http://event-service:3002

```NODE_ENV=development

```

3. **Set up environment variables**

**Payment Service (.env)**

Copy the `.env.example` files to `.env` in each directory:```

````bashPORT=3004

cp .env.example .envMONGODB_URI=mongodb://localhost:27017/payment_db

cp auth/.env.example auth/.envAUTH_SERVICE_URL=http://auth-service:3001

cp event/.env.example event/.envTICKET_SERVICE_URL=http://ticket-service:3003

cp ticket/.env.example ticket/.envNODE_ENV=development

cp payment/.env.example payment/.env```

````

**Frontend (.env)**

4. **Start MongoDB**```

   ```bashREACT_APP_AUTH_SERVICE_URL=http://localhost:3001

   # Using system serviceREACT_APP_EVENT_SERVICE_URL=http://localhost:3002

   sudo systemctl start mongodREACT_APP_TICKET_SERVICE_URL=http://localhost:3003
   ```

REACT_APP_PAYMENT_SERVICE_URL=http://localhost:3004

# Or using MongoDB directly```

mongod --dbpath /path/to/data

````## Deployment



### Running the Application### AWS Infrastructure with Terraform



You need to run all services simultaneously. Open separate terminal windows for each:1. **Initialize Terraform**

```bash

**Terminal 1 - Auth Service:**cd terraform

```bashterraform init

cd authterraform plan

npm startterraform apply

````

**Terminal 2 - Event Service:**2. **Deploy to Kubernetes**

`bash`bash

cd event# Update kubeconfig

npm startaws eks update-kubeconfig --region us-west-2 --name event-ticketing-cluster

````

# Apply Kubernetes manifests

**Terminal 3 - Ticket Service:**kubectl apply -f k8s/

```bash```

cd ticket

npm start### CI/CD Pipeline

````

The GitHub Actions pipeline automatically:

**Terminal 4 - Payment Service:**- Runs security scans (SAST with CodeQL)

````bash- Builds and tests all services

cd payment- Scans Docker images with Trivy

npm start- Pushes images to GitHub Container Registry

```- Deploys to EKS cluster



**Terminal 5 - Frontend:**## API Documentation

```bash

npm run dev### Auth Service Endpoints

```- `POST /api/auth/register` - User registration

- `POST /api/auth/login` - User login

The application will be available at `http://localhost:5173`- `POST /api/auth/logout` - User logout

- `GET /api/auth/me` - Get current user

## 🔧 Environment Variables- `GET /api/auth/verify` - Verify session (internal)



### Frontend (.env)### Event Service Endpoints

```- `GET /api/events` - List all events

VITE_AUTH_SERVICE_URL=http://localhost:3001- `GET /api/events/:id` - Get event details

VITE_EVENT_SERVICE_URL=http://localhost:3002- `POST /api/events` - Create event (admin only)

VITE_TICKET_SERVICE_URL=http://localhost:3003- `PUT /api/events/:id` - Update event (admin only)

VITE_PAYMENT_SERVICE_URL=http://localhost:3004- `DELETE /api/events/:id` - Delete event (admin only)

````

### Ticket Service Endpoints

### Auth Service (auth/.env)- `GET /api/tickets/event/:eventId` - Get available tickets for event

```- `POST /api/tickets/book` - Book tickets

PORT=3001- `GET /api/tickets/orders` - Get user's orders

MONGODB_URI=mongodb://localhost:27017/auth_db- `GET /api/tickets/orders/:id` - Get order details

SESSION_SECRET=your-secret-key

FRONTEND_URL=http://localhost:5173### Payment Service Endpoints

NODE_ENV=development- `POST /api/payment/process` - Process payment

```- `GET /api/payment/status/:orderId` - Get payment status

### Event Service (event/.env)## Security Features

````

PORT=3002- Session-based authentication

MONGODB_URI=mongodb://localhost:27018/event_db- Input validation and sanitization

AUTH_SERVICE_URL=http://localhost:3001- Rate limiting

FRONTEND_URL=http://localhost:5173- CORS configuration

NODE_ENV=development- Security headers

```- Container image vulnerability scanning

- Static Application Security Testing (SAST)

### Ticket Service (ticket/.env)

```## Monitoring & Logging

PORT=3003

MONGODB_URI=mongodb://localhost:27019/ticket_db- Structured logging with Winston

AUTH_SERVICE_URL=http://localhost:3001- Health check endpoints

EVENT_SERVICE_URL=http://localhost:3002- Prometheus metrics (ready for integration)

FRONTEND_URL=http://localhost:5173- Request/response logging middleware

NODE_ENV=development

```## Development



### Payment Service (payment/.env)### Running Individual Services

````

PORT=3004Each service can be run independently:

MONGODB_URI=mongodb://localhost:27020/payment_db

AUTH_SERVICE_URL=http://localhost:3001```bash

TICKET_SERVICE_URL=http://localhost:3003cd auth

FRONTEND_URL=http://localhost:5173npm install

NODE_ENV=developmentnpm run dev

```

cd ../event

## 📁 Project Structurenpm install

npm run dev

```

ticketer/# ... repeat for other services

├── src/ # Frontend source code```

│ ├── components/ # React components

│ ├── contexts/ # React contexts (Auth)### Testing

│ ├── services/ # API service layer

│ ├── App.tsx # Main app component```bash

│ └── main.tsx # App entry point# Run tests for all services

├── auth/ # Auth microservicenpm run test:all

│ └── src/

│ ├── models/ # MongoDB models# Run tests for specific service

│ ├── routes/ # API routescd auth

│ ├── middleware/ # Auth middlewarenpm test

│ └── server.js # Service entry point```

├── event/ # Event microservice

│ └── src/## Contributing

│ ├── models/

│ ├── routes/1. Fork the repository

│ ├── middleware/2. Create a feature branch

│ └── server.js3. Make your changes

├── ticket/ # Ticket microservice4. Add tests

│ └── src/5. Run security scans

│ ├── models/6. Submit a pull request

│ ├── routes/

│ ├── middleware/## License

│ └── server.js

├── payment/ # Payment microserviceMIT License - see LICENSE file for details

│ └── src/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ └── server.js
├── package.json # Frontend dependencies
└── README.md # This file

````

## 🔌 API Endpoints

### Auth Service (http://localhost:3001)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify session (internal)

### Event Service (http://localhost:3002)
- `GET /api/events` - List all events (with optional category filter)
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event (requires auth)
- `GET /api/events/my/events` - Get user's events (requires auth)

### Ticket Service (http://localhost:3003)
- `POST /api/tickets/book` - Book tickets (requires auth)
- `GET /api/tickets/orders` - Get user's orders (requires auth)
- `GET /api/tickets/orders/:id` - Get specific order (requires auth)
- `PUT /api/tickets/orders/:id/status` - Update order status (internal)

### Payment Service (http://localhost:3004)
- `POST /api/payment/process` - Process payment (requires auth)
- `GET /api/payment/history` - Get payment history (requires auth)

## 🎨 Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Sonner (Toast notifications)

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- Express Session
- Joi (Validation)
- Winston (Logging)
- Helmet (Security)
- CORS

## 🐛 Development

### Running in Development Mode

Each service can be run independently in development mode:

```bash
# Auth service
cd auth && npm run dev

# Event service
cd event && npm run dev

# Ticket service
cd ticket && npm run dev

# Payment service
cd payment && npm run dev

# Frontend
npm run dev
````

### Testing

You can test the API endpoints using tools like:

- Postman
- cURL
- Thunder Client (VS Code extension)

Example cURL command:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## 🚢 Deployment

### Docker Deployment (Optional)

Each service has a Dockerfile. You can use Docker Compose to deploy all services:

```bash
docker-compose up -d
```

### Production Considerations

1. **Environment Variables**: Update all environment variables for production
2. **MongoDB**: Use a managed MongoDB service (MongoDB Atlas, AWS DocumentDB)
3. **Security**:
   - Change SESSION_SECRET to a strong random value
   - Enable HTTPS
   - Configure proper CORS origins
4. **Scaling**: Consider using a load balancer and running multiple instances
5. **Monitoring**: Implement logging and monitoring solutions (ELK, Datadog, etc.)

## 📝 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, please open an issue in the repository.

---

Built with ❤️ using modern web technologies
