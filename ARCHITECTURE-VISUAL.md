# Event Ticketing Platform - Visual Architecture Guide

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER'S WEB BROWSER                                │
│                     http://localhost:3000                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React App)                                 │
│                        Port: 3000                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Pages:                                                           │  │
│  │  • Events.js - Browse events                                     │  │
│  │  • EventDetail.js - View event & book tickets                    │  │
│  │  • CreateEvent.js - Create new event                             │  │
│  │  • MyEvents.js - Manage your events                              │  │
│  │  • MyOrders.js - View your bookings                              │  │
│  │  • Login.js / Register.js - Authentication                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  API Service Layer (src/services/api.js)                                │
│  • authService - Login, register, logout                                │
│  • eventService - Get events, create event                              │
│  • ticketService - Book tickets, get orders                             │
│  • paymentService - Process payments                                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┬───────────────────┐
         │                   │                   │                   │
         ↓                   ↓                   ↓                   ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  AUTH SERVICE   │ │  EVENT SERVICE  │ │ TICKET SERVICE  │ │ PAYMENT SERVICE │
│   Port: 3001    │ │   Port: 3002    │ │   Port: 3003    │ │   Port: 3004    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│                 │ │                 │ │                 │ │                 │
│ POST /register  │ │ GET /events     │ │ POST /book      │ │ POST /process   │
│ POST /login     │ │ GET /events/:id │ │ GET /orders     │ │ GET /status/:id │
│ POST /logout    │ │ POST /events    │ │ GET /orders/:id │ │                 │
│ GET /me         │ │ GET /my/events  │ │                 │ │                 │
│ GET /verify     │ │                 │ │                 │ │                 │
│                 │ │                 │ │                 │ │                 │
│ Uses:           │ │ Uses:           │ │ Uses:           │ │ Uses:           │
│ • bcryptjs      │ │ • axios         │ │ • axios         │ │ • axios         │
│ • express-      │ │ • joi           │ │ • joi           │ │ • joi           │
│   session       │ │ • winston       │ │ • winston       │ │ • winston       │
│ • joi           │ │                 │ │                 │ │                 │
│ • winston       │ │                 │ │                 │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
         │                   │                   │                   │
         ↓                   ↓                   ↓                   ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  auth_db        │ │  event_db       │ │  ticket_db      │ │  payment_db     │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ Collections:    │ │ Collections:    │ │ Collections:    │ │ Collections:    │
│ • users         │ │ • events        │ │ • orders        │ │ • payments      │
│ • sessions      │ │                 │ │ • tickets       │ │                 │
│                 │ │                 │ │                 │ │                 │
│ MongoDB         │ │ MongoDB         │ │ MongoDB         │ │ MongoDB         │
│ localhost:27017 │ │ localhost:27017 │ │ localhost:27017 │ │ localhost:27017 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🔄 Request Flow Examples

### 1. User Registration Flow

```
Browser
  │
  └─ POST /api/auth/register
      {email, password, firstName, lastName}
          │
          ↓
    Auth Service (3001)
          │
          ├─ Validate input (Joi)
          ├─ Hash password (bcryptjs)
          ├─ Save to MongoDB
          ├─ Create session
          └─ Return user + set cookie
                │
                ↓
          Browser stores cookie
```

### 2. Browse Events Flow

```
Browser
  │
  └─ GET /api/events?category=Music
          │
          ↓
    Event Service (3002)
          │
          ├─ Query MongoDB events collection
          ├─ Filter by category="music"
          └─ Return events array
                │
                ↓
          Frontend displays events
```

### 3. Create Event Flow

```
Browser (authenticated)
  │
  └─ POST /api/events
      {title, description, date, location, category, ticketTypes}
      [includes session cookie]
          │
          ↓
    Event Service (3002)
          │
          ├─ Extract cookie from request
          ├─ Call Auth Service: GET /verify
          │     │
          │     ↓
          │   Auth Service (3001)
          │     │
          │     ├─ Validate session
          │     └─ Return user info
          │           │
          │           ↓
          ├─ Verify user authenticated
          ├─ Validate event data
          ├─ Save event to MongoDB
          └─ Return event with ID
                │
                ↓
          Frontend redirects to My Events
```

### 4. Book Tickets Flow (Most Complex!)

```
Step 1: Frontend
  │
  └─ POST /api/tickets/book
      {eventId, tickets, customerInfo}
      [includes session cookie]
          │
          ↓
Step 2: Ticket Service (3003)
          │
          ├─ Verify auth with Auth Service
          │     │
          │     ↓
          │   Auth Service returns user
          │
          ├─ Call Event Service for event details
          │     │
          │     └─ GET /api/events/:eventId
          │           │
          │           ↓
          │     Event Service (3002)
          │           │
          │           ├─ Query event from MongoDB
          │           └─ Return event data
          │                 │
          │                 ↓
          ├─ Validate ticket availability
          ├─ Calculate total amount
          ├─ Generate booking reference
          ├─ Create order in MongoDB
          └─ Return {orderId, bookingReference, totalAmount}
                │
                ↓
Step 3: Frontend receives orderId
          │
          └─ POST /api/payment/process
              {orderId, paymentMethod, paymentDetails}
                  │
                  ↓
Step 4: Payment Service (3004)
          │
          ├─ Verify auth
          │
          ├─ Call Ticket Service for order
          │     │
          │     └─ GET /api/tickets/orders/:orderId
          │           │
          │           ↓
          │     Ticket Service returns order
          │
          ├─ Simulate payment (90% success)
          ├─ Create payment record
          │
          ├─ If successful:
          │   └─ PUT /api/tickets/orders/:orderId/status
          │       {status: "confirmed"}
          │             │
          │             ↓
          │       Ticket Service updates order
          │
          └─ Return payment result
                │
                ↓
          Frontend shows success/failure
```

## 📊 Data Models

### User (auth_db)

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String ("user" | "admin"),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Event (event_db)

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  venue: {
    name: String,
    address: String,
    city: String,
    capacity: Number
  },
  dateTime: Date,
  duration: Number (minutes),
  ticketTypes: [{
    name: String,
    price: Number,
    quantity: Number,
    description: String
  }],
  organizer: {
    name: String,
    email: String,
    phone: String
  },
  status: String ("draft" | "published" | "cancelled"),
  createdBy: ObjectId (user._id),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order (ticket_db)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  eventId: ObjectId,
  tickets: [{
    ticketType: {
      name: String,
      price: Number
    },
    quantity: Number,
    subtotal: Number
  }],
  totalAmount: Number,
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  bookingReference: String (unique),
  status: String ("pending" | "confirmed" | "cancelled"),
  createdAt: Date,
  updatedAt: Date
}
```

### Payment (payment_db)

```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  userId: ObjectId,
  amount: Number,
  currency: String ("USD"),
  paymentMethod: String ("credit_card" | "debit_card" | "paypal"),
  status: String ("pending" | "processing" | "completed" | "failed"),
  gatewayResponse: {
    transactionId: String,
    responseCode: String,
    responseMessage: String
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication Flow

```
┌──────────┐
│  Login   │
└────┬─────┘
     │
     ↓
┌─────────────────────────────┐
│  POST /api/auth/login       │
│  {email, password}          │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Auth Service               │
│  • Find user by email       │
│  • Compare password         │
│  • Create session           │
│  • Store in MongoDB         │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Set-Cookie: connect.sid=xxx│
│  httpOnly: true             │
│  secure: false (dev)        │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Browser stores cookie      │
│  All future requests        │
│  include this cookie        │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Protected Request          │
│  Cookie: connect.sid=xxx    │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Service calls              │
│  GET /api/auth/verify       │
│  with cookie                │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Auth Service               │
│  • Validates session        │
│  • Returns user info        │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Request proceeds           │
│  with user context          │
└─────────────────────────────┘
```

## 🎯 Service Dependencies

```
Frontend
   │
   ├──→ Auth Service (always)
   ├──→ Event Service (for events)
   ├──→ Ticket Service (for bookings)
   └──→ Payment Service (for payments)

Auth Service
   │
   └──→ MongoDB (auth_db)

Event Service
   │
   ├──→ Auth Service (to verify users)
   └──→ MongoDB (event_db)

Ticket Service
   │
   ├──→ Auth Service (to verify users)
   ├──→ Event Service (to get event details)
   └──→ MongoDB (ticket_db)

Payment Service
   │
   ├──→ Auth Service (to verify users)
   ├──→ Ticket Service (to get order details)
   └──→ MongoDB (payment_db)
```

## 🚀 Startup Sequence

```
1. MongoDB
   └─ Must be running first
      │
      ↓
2. Auth Service (Port 3001)
   └─ Other services depend on this
      │
      ↓
3. Event Service (Port 3002)
   └─ Independent, but needed for bookings
      │
      ↓
4. Ticket Service (Port 3003)
   └─ Depends on Event Service
      │
      ↓
5. Payment Service (Port 3004)
   └─ Depends on Ticket Service
      │
      ↓
6. Frontend (Port 3000)
   └─ Connects to all services
```

## 📝 Port Summary

| Service  | Port  | Database   | Purpose          |
| -------- | ----- | ---------- | ---------------- |
| Frontend | 3000  | -          | React UI         |
| Auth     | 3001  | auth_db    | Authentication   |
| Event    | 3002  | event_db   | Event management |
| Ticket   | 3003  | ticket_db  | Booking/Orders   |
| Payment  | 3004  | payment_db | Payments         |
| MongoDB  | 27017 | All DBs    | Data storage     |

## 🎨 Technology Stack Visual

```
┌─────────────────────────────────────┐
│           FRONTEND                   │
│  • React 18                          │
│  • React Router                      │
│  • Axios                             │
│  • Context API                       │
│  • Tailwind CSS (assumed)           │
└─────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│          BACKEND SERVICES            │
│  • Node.js                           │
│  • Express.js                        │
│  • Mongoose (ODM)                    │
│  • Joi (validation)                  │
│  • Winston (logging)                 │
│  • bcryptjs (password hashing)       │
│  • express-session (sessions)        │
│  • Helmet (security)                 │
│  • CORS                              │
└─────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│           DATABASE                   │
│  • MongoDB 7.x                       │
│  • Multiple databases                │
│  • Collections per service           │
└─────────────────────────────────────┘
```

This visual guide should help you understand how all the pieces fit together!
