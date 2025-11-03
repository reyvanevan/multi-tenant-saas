/**
 * Auth Service
 * Handles all authentication-related API calls
 */

import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenResponse,
  ChangePasswordRequest,
  User,
} from '@/types/auth.types';

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        credentials,
      );

      const { access_token, refresh_token, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Update auth store
      useAuthStore.getState().setUser(user);

      console.log('✅ Login successful:', user.email);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 'Invalid credentials',
      );
    }
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        data,
      );

      const { access_token, refresh_token, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Update auth store
      useAuthStore.getState().setUser(user);

      console.log('✅ Registration successful:', user.email);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Registration failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Registration failed',
      );
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      // Call backend logout endpoint if refresh token exists
      if (refreshToken) {
        try {
          await apiClient.post('/auth/logout', {
            refreshToken,
          });
          console.log('✅ Backend logout successful');
        } catch (error: any) {
          // 401 is expected if token expired, just log as info
          if (error.response?.status === 401) {
            console.info(
              'ℹ️ Token expired during logout (expected), clearing local state',
            );
          } else {
            console.warn(
              '⚠️ Backend logout failed, clearing local state anyway:',
              error.response?.data || error.message,
            );
          }
          // Continue with local logout even if backend call fails
        }
      }

      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Clear auth store
      useAuthStore.getState().logout();

      console.log('✅ Logout successful - tokens cleared and store reset');
    } catch (error: any) {
      console.error('❌ Logout failed:', error.response?.data || error.message);
      // Still clear local state even if API call fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.getState().logout();
    }
  },

  /**
   * Refresh access token
   * Called automatically by API client interceptor
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<RefreshTokenResponse>(
        '/auth/refresh',
        {
          refresh_token: refreshToken,
        },
      );

      const { access_token } = response.data;

      // Update access token in localStorage
      localStorage.setItem('access_token', access_token);

      console.log('✅ Token refreshed successfully');
      return access_token;
    } catch (error: any) {
      console.error(
        '❌ Token refresh failed:',
        error.response?.data || error.message,
      );

      // Clear tokens and logout user
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      useAuthStore.getState().logout();

      throw new Error('Session expired. Please login again.');
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');

      // Update auth store with fresh user data
      useAuthStore.getState().setUser(response.data);

      console.log('✅ Current user fetched:', response.data.email);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Get current user failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to fetch user data',
      );
    }
  },

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', data);

      console.log('✅ Password changed successfully');
    } catch (error: any) {
      console.error(
        '❌ Change password failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to change password',
      );
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = useAuthStore.getState().user;
    return !!(token && user);
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },
};

/**
 * Export default
 */
export default authService;
