import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Reseller API
export const resellerApi = {
  getAll: () => api.get('/resellers'),
  getById: (id: string) => api.get(`/resellers/${id}`),
  create: (data: any) => api.post('/resellers', data),
  update: (id: string, data: any) => api.put(`/resellers/${id}`, data),
  delete: (id: string) => api.delete(`/resellers/${id}`),
  getDashboard: (id: string) => api.get(`/resellers/${id}/dashboard`),
};

// Outlet API
export const outletApi = {
  getByReseller: (resellerId: string) => api.get(`/outlets/reseller/${resellerId}`),
  getById: (id: string) => api.get(`/outlets/${id}`),
  create: (data: any) => api.post('/outlets', data),
  update: (id: string, data: any) => api.put(`/outlets/${id}`, data),
  delete: (id: string) => api.delete(`/outlets/${id}`),
  getDashboard: (id: string) => api.get(`/outlets/${id}/dashboard`),
};

// Agent API
export const agentApi = {
  getByReseller: (resellerId: string) => api.get(`/agents/reseller/${resellerId}`),
  getByOutlet: (outletId: string) => api.get(`/agents/outlet/${outletId}`),
  getById: (id: string) => api.get(`/agents/${id}`),
  create: (data: any) => api.post('/agents', data),
  update: (id: string, data: any) => api.put(`/agents/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/agents/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/agents/${id}`),
  assignTask: (id: string, data: any) => api.post(`/agents/${id}/tasks`, data),
  getTasks: (id: string, status?: string) => api.get(`/agents/${id}/tasks`, { params: { status } }),
  updateTask: (taskId: string, data: any) => api.patch(`/agents/tasks/${taskId}`, data),
  getActions: (id: string) => api.get(`/agents/${id}/actions`),
  logAction: (id: string, data: any) => api.post(`/agents/${id}/actions`, data),
  getMetrics: (id: string) => api.get(`/agents/${id}/metrics`),
};

// Inventory API
export const inventoryApi = {
  getByOutlet: (outletId: string, lowStock?: boolean) =>
    api.get(`/inventory/outlet/${outletId}`, { params: { lowStock } }),
  getProducts: (category?: string, search?: string) =>
    api.get('/inventory/products', { params: { category, search } }),
  createProduct: (data: any) => api.post('/inventory/products', data),
  addToOutlet: (outletId: string, data: any) => api.post(`/inventory/outlet/${outletId}`, data),
  adjustQuantity: (id: string, adjustment: number, reason?: string) =>
    api.patch(`/inventory/${id}/quantity`, { adjustment, reason }),
  reserve: (id: string, quantity: number) => api.patch(`/inventory/${id}/reserve`, { quantity }),
  release: (id: string, quantity: number) => api.patch(`/inventory/${id}/release`, { quantity }),
  fulfill: (id: string, quantity: number) => api.patch(`/inventory/${id}/fulfill`, { quantity }),
  restock: (id: string, quantity: number) => api.post(`/inventory/${id}/restock`, { quantity }),
  getAlerts: (resellerId: string) => api.get(`/inventory/alerts/${resellerId}`),
};

// Order API
export const orderApi = {
  // Retail orders
  getRetailByOutlet: (outletId: string, status?: string) =>
    api.get(`/orders/retail/outlet/${outletId}`, { params: { status } }),
  getRetailById: (id: string) => api.get(`/orders/retail/${id}`),
  createRetail: (data: any) => api.post('/orders/retail', data),
  updateRetailStatus: (id: string, status: string, paymentStatus?: string) =>
    api.patch(`/orders/retail/${id}/status`, { status, paymentStatus }),

  // Wholesale orders
  getWholesaleByReseller: (resellerId: string, status?: string) =>
    api.get(`/orders/wholesale/reseller/${resellerId}`, { params: { status } }),
  createWholesale: (data: any) => api.post('/orders/wholesale', data),
  updateWholesaleStatus: (id: string, status: string) =>
    api.patch(`/orders/wholesale/${id}/status`, { status }),

  // Analytics
  getAnalytics: (resellerId: string, period?: number) =>
    api.get(`/orders/analytics/${resellerId}`, { params: { period } }),
};

export default api;
