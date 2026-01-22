import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data.data;
              useAuthStore.getState().login(
                useAuthStore.getState().user!,
                accessToken,
                newRefreshToken
              );

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) {
    const response = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async guestLogin() {
    const response = await this.api.post('/auth/guest');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Device endpoints
  async getDevices() {
    const response = await this.api.get('/devices');
    return response.data;
  }

  async getDevice(id: string) {
    const response = await this.api.get(`/devices/${id}`);
    return response.data;
  }

  async createDevice(data: {
    name: string;
    type: string;
    protocol?: string;
    roomId?: string;
  }) {
    const response = await this.api.post('/devices', data);
    return response.data;
  }

  async updateDevice(id: string, data: { name?: string; roomId?: string }) {
    const response = await this.api.put(`/devices/${id}`, data);
    return response.data;
  }

  async updateDeviceState(id: string, state: Record<string, unknown>) {
    const response = await this.api.patch(`/devices/${id}/state`, { state });
    return response.data;
  }

  async deleteDevice(id: string) {
    const response = await this.api.delete(`/devices/${id}`);
    return response.data;
  }

  // Room endpoints
  async getRooms() {
    const response = await this.api.get('/rooms');
    return response.data;
  }

  async getRoom(id: string) {
    const response = await this.api.get(`/rooms/${id}`);
    return response.data;
  }

  async createRoom(data: { name: string; icon?: string; color?: string }) {
    const response = await this.api.post('/rooms', data);
    return response.data;
  }

  async updateRoom(id: string, data: { name?: string; icon?: string; color?: string }) {
    const response = await this.api.put(`/rooms/${id}`, data);
    return response.data;
  }

  async deleteRoom(id: string) {
    const response = await this.api.delete(`/rooms/${id}`);
    return response.data;
  }

  // User endpoints
  async getUserStats() {
    const response = await this.api.get('/users/stats');
    return response.data;
  }

  async updateProfile(data: { firstName?: string; lastName?: string; phoneNumber?: string }) {
    const response = await this.api.put('/users/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.api.put('/users/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
