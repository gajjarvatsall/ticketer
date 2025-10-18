# 🚀 COMPLETE SETUP GUIDE - Event Ticketing Platform

## ✅ What Has Been Done

I've successfully disconnected your project from Convex and connected it to a local microservices architecture. Here's what changed:

### Changes Made:

1. ✅ Created `package.json` files for all microservices (auth, event, ticket, payment, frontend)
2. ✅ Simplified and fixed all API routes to work together
3. ✅ Updated frontend to call REST APIs instead of Convex
4. ✅ Created all necessary environment files (.env)
5. ✅ Built complete React pages (Events, EventDetail, CreateEvent, MyEvents, MyOrders)
6. ✅ Configured API service layer for clean HTTP requests
7. ✅ Set up authentication flow between services

### Removed:

- ❌ All Convex dependencies and code
- ❌ Convex backend functions
- ❌ Convex configuration files

## 📋 PREREQUISITES

Before running the project, make sure you have:

1. **Node.js** (v18 or higher)

   - Check: `node --version`
   - Download: https://nodejs.org/

2. **MongoDB** (Community Edition)
   - Check: `mongod --version`
   - Download: https://www.mongodb.com/try/download/community
3. **npm** (comes with Node.js)
   - Check: `npm --version`

## 🎯 OPTION 1: Running with Docker (EASIEST)

If you have Docker Desktop installed:

```bash
# Start all services and databases
docker-compose up -d

# Wait 30-60 seconds for services to initialize

# Open browser at http://localhost:3000

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

## 🎯 OPTION 2: Running Locally (Step-by-Step)

### Step 1: Start MongoDB

```bash
# On macOS with Homebrew:
brew services start mongodb-community

# On Windows:
# Start MongoDB from Services or run mongod.exe

# On Linux:
sudo systemctl start mongod

# Verify it's running:
mongo --eval "db.version()"
```

### Step 2: Install Dependencies

Open terminal in project root and run:

```bash
# Install all dependencies for all services
cd auth && npm install && cd ..
cd event && npm install && cd ..
cd ticket && npm install && cd ..
cd payment && npm install && cd ..
cd frontend && npm install && cd ..
```

This will take a few minutes.

### Step 3: Start All Services

You need to open **5 separate terminal windows/tabs**:

**Terminal 1 - Auth Service**:

```bash
cd auth
npm run dev
```

✅ Should see: "Auth service running on port 3001"

**Terminal 2 - Event Service**:

```bash
cd event
npm run dev
```

✅ Should see: "Event service running on port 3002"

**Terminal 3 - Ticket Service**:

```bash
cd ticket
npm run dev
```

✅ Should see: "Ticket service running on port 3003"

**Terminal 4 - Payment Service**:

```bash
cd payment
npm run dev
```

✅ Should see: "Payment service running on port 3004"

**Terminal 5 - Frontend**:

```bash
cd frontend
npm start
```

✅ Should automatically open browser at http://localhost:3000

### Step 4: Test the Application

1. **Register a new user**:

   - Click "Register" in the top navigation
   - Fill in: First Name, Last Name, Email, Password
   - Click "Register"

2. **Create an event**:

   - After login, click "Create Event"
   - Fill in event details
   - Add at least one ticket type with price and quantity
   - Click "Create Event"

3. **Browse and book tickets**:

   - Go to "Events" page
   - Click on any event
   - Click "Book Tickets"
   - Select quantity for ticket types
   - Fill in customer information
   - Enter payment details (Test card: 4111111111111111, expiry: any future date, CVV: 123)
   - Click "Complete Booking"

4. **View your orders**:

   - Click "My Orders" to see all bookings

5. **View your events**:
   - Click "My Events" to see events you created

## 🐛 TROUBLESHOOTING

### Problem: "Port 3XXX is already in use"

**Solution**:

```bash
# Find what's using the port (macOS/Linux)
lsof -i :3001

# Kill the process
kill -9 <PID>

# On Windows, use Task Manager or:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Problem: "MongoDB connection error"

**Solutions**:

1. Make sure MongoDB is running:

   ```bash
   # macOS
   brew services list | grep mongodb

   # Linux
   sudo systemctl status mongod
   ```

2. Check if MongoDB is accessible:

   ```bash
   mongo --eval "db.version()"
   ```

3. If MongoDB is on a different port, update all `.env` files

### Problem: "Cannot read property 'user' of undefined"

**Solution**: Make sure Auth service is running first, then restart other services

### Problem: Frontend shows "Failed to fetch"

**Solution**:

1. Check all 4 backend services are running
2. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Check `.env` file in frontend folder has correct URLs

### Problem: Login doesn't work

**Solution**:

1. Make sure Auth service (port 3001) is running
2. Check browser console for errors
3. Try registering a new user first

### Problem: "npm install" fails

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Try again
npm install
```

## 📊 VERIFYING SERVICES ARE RUNNING

Open these URLs in your browser:

1. Auth Service Health: http://localhost:3001/health

   - Should show: `{"status":"healthy","service":"auth-service"}`

2. Event Service Health: http://localhost:3002/health

   - Should show: `{"status":"healthy","service":"event-service"}`

3. Ticket Service Health: http://localhost:3003/health

   - Should show: `{"status":"healthy","service":"ticket-service"}`

4. Payment Service Health: http://localhost:3004/health

   - Should show: `{"status":"healthy","service":"payment-service"}`

5. Frontend: http://localhost:3000
   - Should show the application home page

## 📁 PROJECT STRUCTURE

```
project-root/
├── auth/                    # Authentication Service
│   ├── src/
│   │   ├── server.js       # Entry point
│   │   ├── routes/
│   │   │   └── auth.js     # Auth routes
│   │   ├── models/
│   │   │   └── User.js     # User model
│   │   ├── middleware/
│   │   │   └── auth.js     # Auth middleware
│   │   └── utils/
│   │       └── logger.js   # Winston logger
│   ├── package.json
│   └── .env
│
├── event/                   # Event Management Service
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── events-simple.js  # Event routes
│   │   └── models/
│   │       └── Event.js    # Event model
│   ├── package.json
│   └── .env
│
├── ticket/                  # Ticket Booking Service
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── tickets-simple.js  # Ticket routes
│   │   └── models/
│   │       └── Order.js    # Order model
│   ├── package.json
│   └── .env
│
├── payment/                 # Payment Processing Service
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── payments-simple.js  # Payment routes
│   │   └── models/
│   │       └── Payment.js  # Payment model
│   ├── package.json
│   └── .env
│
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── App.js          # Main app component
│   │   ├── pages/
│   │   │   ├── Events.js   # Events listing
│   │   │   ├── EventDetail.js  # Event details & booking
│   │   │   ├── CreateEvent.js  # Create event form
│   │   │   ├── MyEvents.js     # User's events
│   │   │   ├── MyOrders.js     # User's orders
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Registration
│   │   │   └── Profile.js      # User profile
│   │   ├── components/
│   │   │   └── Navbar.js       # Navigation bar
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Auth state management
│   │   └── services/
│   │       └── api.js          # API service layer
│   ├── package.json
│   └── .env
│
├── docker-compose.yml      # Docker orchestration
└── README-MICROSERVICES.md # This guide
```

## 🔑 KEY FEATURES EXPLAINED

### 1. Authentication Flow

- User registers/logs in → Auth service creates session
- Session cookie sent to browser
- All requests include cookie
- Services validate with Auth service

### 2. Event Creation Flow

- User creates event → Event service stores in MongoDB
- Includes title, description, date, location, category, ticket types
- User can view their events in "My Events"

### 3. Booking Flow

- User selects event → Views details
- Clicks "Book Tickets" → Multi-step form appears
- Step 1: Select ticket quantities
- Step 2: Enter customer info
- Step 3: Payment details
- Creates order in Ticket service
- Processes payment in Payment service (90% success rate - simulated)
- Updates order status to "confirmed"

### 4. Inter-Service Communication

- Services communicate via HTTP REST APIs
- Example: Ticket service calls Event service to get event details
- Example: Payment service calls Ticket service to get order details

## 🎓 HOW TO USE THE APPLICATION

### As an Event Organizer:

1. Register/Login
2. Go to "Create Event"
3. Fill in all details
4. Add ticket types (e.g., VIP $100, General $50)
5. Submit
6. View in "My Events"

### As an Attendee:

1. Register/Login
2. Browse "Events"
3. Click on event
4. Click "Book Tickets"
5. Select quantities
6. Fill in info
7. Complete payment
8. View in "My Orders"

## 📝 TEST DATA

### Test Credit Cards (Simulated):

- Card Number: 4111111111111111 (Visa)
- Card Number: 5111111111111111 (Mastercard)
- Expiry: Any future date (e.g., 12/2025)
- CVV: Any 3 digits (e.g., 123)
- Cardholder: Any name

### Payment Success Rate:

- 90% of payments succeed (simulated)
- 10% fail randomly for testing error handling

## 🚀 NEXT STEPS

Once everything is running:

1. ✅ Create a user account
2. ✅ Create an event
3. ✅ Book tickets for an event
4. ✅ Check your orders
5. ✅ Explore all features

## 💡 TIPS

- Keep all 5 terminal windows open while testing
- Check logs if something doesn't work
- MongoDB must be running before starting services
- Frontend automatically refreshes when you make code changes
- Backend requires restart after code changes (Ctrl+C then `npm run dev` again)

## 📞 COMMON QUESTIONS

**Q: Can I run this in production?**
A: This is a development setup. For production, you'd need:

- Environment-specific configuration
- Real payment gateway integration
- SSL certificates
- Production MongoDB
- Load balancing
- Error monitoring

**Q: Why so many terminals?**
A: Each microservice runs independently. In production, they'd run on separate servers/containers.

**Q: What if I want to add more features?**
A: You can:

- Add new endpoints in service routes
- Create new pages in frontend/src/pages
- Add new models in service models
- Update the API service layer

**Q: How do I stop everything?**
A: Press Ctrl+C in each terminal window

## 🎉 SUCCESS!

If you can:

1. ✅ See the homepage at http://localhost:3000
2. ✅ Register a new user
3. ✅ Create an event
4. ✅ Book tickets

**Congratulations! Your microservices platform is working perfectly!**

---

Need help? Check the logs in each terminal for error messages.
