# Event Ticketing Platform - Microservices Architecture
i
A complete event ticketing platform built with microservices architecture using Node.js, Express, MongoDB, and React.

## 🏗️ Architecture

This project consists of 5 microservices:

1. **Auth Service** (Port 3001) - User authentication and session management
2. **Event Service** (Port 3002) - Event creation and management
3. **Ticket Service** (Port 3003) - Ticket booking and order management
4. **Payment Service** (Port 3004) - Payment processing (simulated)
5. **Frontend** (Port 3000) - React application

Each service has its own MongoDB database for data isolation.

## ✨ Features

- **User Authentication**: Register, login, logout with session-based auth
- **Event Management**: Create, browse, and search events by category
- **Ticket Booking**: Multi-step booking process with cart functionality
- **Payment Processing**: Simulated payment gateway (90% success rate for demo)
- **Order Management**: View booking history and order details
- **Organizer Dashboard**: Manage your created events

## 🚀 Quick Start with Docker

### Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

### Running with Docker (Recommended)

1. **Start all services**:

   ```bash
   docker-compose up -d
   ```

2. **Wait for services to initialize** (about 30-60 seconds)

3. **Access the application**:

   - Frontend: http://localhost:3000
   - Auth Service: http://localhost:3001
   - Event Service: http://localhost:3002
   - Ticket Service: http://localhost:3003
   - Payment Service: http://localhost:3004

4. **View logs**:

   ```bash
   docker-compose logs -f
   ```

5. **Stop all services**:
   ```bash
   docker-compose down
   ```

## 🛠️ Manual Setup (Without Docker)

### Prerequisites

- Node.js 18+ installed
- MongoDB installed and running locally
- npm or yarn package manager

### Step 1: Install Dependencies

Run this command from the project root:

```bash
cd auth && npm install && cd ../event && npm install && cd ../ticket && npm install && cd ../payment && npm install && cd ../frontend && npm install && cd ..
```

### Step 2: Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux with systemd
sudo systemctl start mongod

# Or run directly
mongod --dbpath /path/to/your/data
```

### Step 3: Start All Services

Open 5 separate terminal windows:

**Terminal 1 - Auth Service**:

```bash
cd auth
npm run dev
```

**Terminal 2 - Event Service**:

```bash
cd event
npm run dev
```

**Terminal 3 - Ticket Service**:

```bash
cd ticket
npm run dev
```

**Terminal 4 - Payment Service**:

```bash
cd payment
npm run dev
```

**Terminal 5 - Frontend**:

```bash
cd frontend
npm start
```

### Step 4: Access the Application

Open your browser and go to: **http://localhost:3000**

## 📋 Environment Variables

Each service has a `.env` file already configured for local development:

### Auth Service (.env)

```
PORT=3001
MONGODB_URI=mongodb://auth-db:27017/auth_db
SESSION_SECRET=dev-session-secret-change-in-production-123456789
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Event Service (.env)

```
PORT=3002
MONGODB_URI=mongodb://event-db:27017/event_db
AUTH_SERVICE_URL=http://auth-service:3001
NODE_ENV=development
```

### Ticket Service (.env)

```
PORT=3003
MONGODB_URI=mongodb://ticket-db:27017/ticket_db
AUTH_SERVICE_URL=http://auth-service:3001
EVENT_SERVICE_URL=http://event-service:3002
NODE_ENV=development
```

### Payment Service (.env)

```
PORT=3004
MONGODB_URI=mongodb://payment-db:27017/payment_db
AUTH_SERVICE_URL=http://auth-service:3001
TICKET_SERVICE_URL=http://ticket-service:3003
NODE_ENV=development
```

### Frontend (.env)

```
REACT_APP_AUTH_SERVICE_URL=http://localhost:3001
REACT_APP_EVENT_SERVICE_URL=http://localhost:3002
REACT_APP_TICKET_SERVICE_URL=http://localhost:3003
REACT_APP_PAYMENT_SERVICE_URL=http://localhost:3004
```

**Note**: When running with Docker, the MongoDB URIs use container names (auth-db, event-db, etc.). For local development without Docker, change them to `mongodb://localhost:27017/`.

## 🧪 Testing the Application

### 1. Register a New User

- Go to http://localhost:3000
- Click "Register"
- Fill in the form and create an account

### 2. Create an Event

- After logging in, click "Create Event" in the navigation
- Fill in event details, including ticket types
- Click "Create Event"

### 3. Book Tickets

- Go to "Events" page
- Click on any event
- Click "Book Tickets"
- Select ticket quantities
- Fill in customer information
- Enter payment details (use test card: 4111111111111111, any future date, any CVV)
- Complete booking

### 4. View Your Orders

- Click "My Orders" in the navigation
- See all your bookings with details

### 5. Manage Your Events

- Click "My Events" to see events you've created

## 📊 Database Collections

Each MongoDB database contains:

**auth_db**:

- users
- sessions

**event_db**:

- events

**ticket_db**:

- tickets
- orders

**payment_db**:

- payments

## 🔧 Troubleshooting

### Problem: Services won't start

**Solution**: Make sure all ports (3000-3004) are available:

```bash
# Check if ports are in use (macOS/Linux)
lsof -i :3000
lsof -i :3001
lsof -i :3002
lsof -i :3003
lsof -i :3004

# Kill processes if needed
kill -9 <PID>
```

### Problem: MongoDB connection error

**Solution**:

- Make sure MongoDB is running
- Check MongoDB URIs in `.env` files
- For Docker: Use container names (auth-db, etc.)
- For local: Use localhost

### Problem: Frontend can't connect to backend

**Solution**:

- Check that all backend services are running
- Verify `.env` files in frontend have correct URLs
- Clear browser cache and restart

### Problem: CORS errors

**Solution**:

- Services are configured for localhost:3000
- If using different URL, update FRONTEND_URL in service `.env` files

## 📝 API Endpoints

### Auth Service (3001)

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user
- GET `/api/auth/verify` - Verify session (internal)

### Event Service (3002)

- GET `/api/events` - List all events (with optional category filter)
- GET `/api/events/:id` - Get event details
- POST `/api/events` - Create event (requires auth)
- GET `/api/events/my/events` - Get user's events (requires auth)

### Ticket Service (3003)

- POST `/api/tickets/book` - Book tickets (requires auth)
- GET `/api/tickets/orders` - Get user's orders (requires auth)
- GET `/api/tickets/orders/:id` - Get specific order (requires auth)

### Payment Service (3004)

- POST `/api/payment/process` - Process payment (requires auth)
- GET `/api/payment/status/:orderId` - Get payment status (requires auth)

## 🎨 Frontend Pages

- `/` - Home page
- `/events` - Browse all events
- `/events/:id` - Event details and booking
- `/login` - User login
- `/register` - User registration
- `/profile` - User profile
- `/create-event` - Create new event (protected)
- `/my-events` - Manage your events (protected)
- `/my-orders` - View your bookings (protected)

## 🔐 Security Features

- Session-based authentication
- Password hashing with bcrypt
- CORS configuration
- Rate limiting
- Input validation
- Security headers with Helmet
- HTTP-only cookies

## 📦 Technology Stack

**Backend**:

- Node.js + Express.js
- MongoDB + Mongoose
- Session management with express-session
- Input validation with Joi
- Logging with Winston
- Security with Helmet

**Frontend**:

- React 18
- React Router for navigation
- Axios for HTTP requests
- Context API for state management
- Tailwind CSS for styling

**DevOps**:

- Docker & Docker Compose
- MongoDB containers
- Multi-service orchestration

## 🚧 Development

### File Structure

```
project-root/
├── auth/               # Auth microservice
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── event/              # Event microservice
├── ticket/             # Ticket microservice
├── payment/            # Payment microservice
├── frontend/           # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── services/
│   ├── package.json
│   └── .env
└── docker-compose.yml
```

## 📄 License

ISC

## 👥 Contributing

This is a demonstration project for educational purposes.

## 🎯 Future Enhancements

- Email notifications
- QR code tickets
- Event analytics dashboard
- Real payment gateway integration
- Event search and advanced filters
- Event recommendations
- Social sharing
- Mobile app
