import axios from "axios";

// Create axios instances for each service
const authAPI = axios.create({
  baseURL: process.env.REACT_APP_AUTH_SERVICE_URL || "http://localhost:3001",
  withCredentials: true,
});

const eventAPI = axios.create({
  baseURL: process.env.REACT_APP_EVENT_SERVICE_URL || "http://localhost:3002",
  withCredentials: true,
});

const ticketAPI = axios.create({
  baseURL: process.env.REACT_APP_TICKET_SERVICE_URL || "http://localhost:3003",
  withCredentials: true,
});

const paymentAPI = axios.create({
  baseURL: process.env.REACT_APP_PAYMENT_SERVICE_URL || "http://localhost:3004",
  withCredentials: true,
});

// Auth API
export const authService = {
  login: (email, password) =>
    authAPI.post("/api/auth/login", { email, password }),
  register: (userData) => authAPI.post("/api/auth/register", userData),
  logout: () => authAPI.post("/api/auth/logout"),
  getMe: () => authAPI.get("/api/auth/me"),
  verify: () => authAPI.get("/api/auth/verify"),
};

// Event API
export const eventService = {
  getAll: (category) => {
    const params = category ? { category } : {};
    return eventAPI.get("/api/events", { params });
  },
  getById: (id) => eventAPI.get(`/api/events/${id}`),
  create: (eventData) => eventAPI.post("/api/events", eventData),
  getMyEvents: () => eventAPI.get("/api/events/my/events"),
};

// Ticket API
export const ticketService = {
  book: (bookingData) => ticketAPI.post("/api/tickets/book", bookingData),
  getMyOrders: () => ticketAPI.get("/api/tickets/orders"),
  getOrder: (id) => ticketAPI.get(`/api/tickets/orders/${id}`),
};

// Payment API
export const paymentService = {
  process: (paymentData) =>
    paymentAPI.post("/api/payment/process", paymentData),
  getStatus: (orderId) => paymentAPI.get(`/api/payment/status/${orderId}`),
};

export default {
  auth: authService,
  event: eventService,
  ticket: ticketService,
  payment: paymentService,
};
