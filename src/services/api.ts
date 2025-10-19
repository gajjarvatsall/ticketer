import axios from 'axios';

// API Base URLs - can be configured via environment variables
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001';
const EVENT_SERVICE_URL = import.meta.env.VITE_EVENT_SERVICE_URL || 'http://localhost:3002';
const TICKET_SERVICE_URL = import.meta.env.VITE_TICKET_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3004';

// Create axios instances with credentials support
const authAPI = axios.create({
  baseURL: AUTH_SERVICE_URL,
  withCredentials: true,
});

const eventAPI = axios.create({
  baseURL: EVENT_SERVICE_URL,
  withCredentials: true,
});

const ticketAPI = axios.create({
  baseURL: TICKET_SERVICE_URL,
  withCredentials: true,
});

const paymentAPI = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
  withCredentials: true,
});

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  venue: {
    name: string;
    address: string;
    city: string;
    capacity: number;
  };
  dateTime: string;
  duration: number;
  ticketTypes: TicketType[];
  organizer: {
    name: string;
    email: string;
    phone?: string;
  };
  images?: { url: string; alt?: string }[];
  status: string;
  createdBy: string;
}

export interface TicketType {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface Order {
  _id: string;
  userId: string;
  eventId: string;
  tickets: {
    ticketType: {
      name: string;
      price: number;
    };
    quantity: number;
    subtotal: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  bookingReference: string;
  createdAt: string;
  event?: Event;
}

// Auth Service API
export const authService = {
  async login(email: string, password: string) {
    const response = await authAPI.post('/api/auth/login', { email, password });
    return response.data;
  },

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await authAPI.post('/api/auth/register', userData);
    return response.data;
  },

  async logout() {
    const response = await authAPI.post('/api/auth/logout');
    return response.data;
  },

  async getMe(): Promise<{ user: User }> {
    const response = await authAPI.get('/api/auth/me');
    return response.data;
  },

  async verify() {
    const response = await authAPI.get('/api/auth/verify');
    return response.data;
  },
};

// Event Service API
export const eventService = {
  async getAll(category?: string): Promise<{ events: Event[] }> {
    const params = category ? { category } : {};
    const response = await eventAPI.get('/api/events', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ event: Event }> {
    const response = await eventAPI.get(`/api/events/${id}`);
    return response.data;
  },

  async create(eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    category: string;
    ticketTypes: TicketType[];
  }): Promise<{ message: string; event: Event }> {
    const response = await eventAPI.post('/api/events', eventData);
    return response.data;
  },

  async getMyEvents(): Promise<{ events: Event[] }> {
    const response = await eventAPI.get('/api/events/my/events');
    return response.data;
  },
};

// Ticket Service API
export const ticketService = {
  async book(bookingData: {
    eventId: string;
    tickets: { ticketTypeName: string; quantity: number }[];
    customerInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  }): Promise<{
    message: string;
    orderId: string;
    bookingReference: string;
    totalAmount: number;
  }> {
    const response = await ticketAPI.post('/api/tickets/book', bookingData);
    return response.data;
  },

  async getMyOrders(): Promise<{ orders: Order[] }> {
    const response = await ticketAPI.get('/api/tickets/orders');
    return response.data;
  },

  async getOrder(id: string): Promise<{ order: Order }> {
    const response = await ticketAPI.get(`/api/tickets/orders/${id}`);
    return response.data;
  },
};

// Payment Service API
export const paymentService = {
  async processPayment(paymentData: {
    orderId: string;
    paymentMethod: string;
    paymentDetails: {
      cardNumber: string;
      cardholderName: string;
      expiryDate: string;
      cvv: string;
    };
  }): Promise<{
    success: boolean;
    message: string;
    payment?: any;
  }> {
    const response = await paymentAPI.post('/api/payment/process', paymentData);
    return response.data;
  },

  async getPaymentHistory(): Promise<{ payments: any[] }> {
    const response = await paymentAPI.get('/api/payment/history');
    return response.data;
  },
};
