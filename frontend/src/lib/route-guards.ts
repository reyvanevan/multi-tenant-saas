/**
 * Route Guards
 * Handles authentication and authorization checks for routes
 */

import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth.service';

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};

/**
 * Get current user from store
 */
export const getCurrentUser = () => {
  return useAuthStore.getState().user;
};

/**
 * Check if user has specific role
 */
export const hasRole = (requiredRoles: string[]): boolean => {
  const user = getCurrentUser();

  if (!user) return false;

  // SUPER_ADMIN has access to everything
  if (user.role.name === 'SUPER_ADMIN') return true;

  // Check if user's role is in requiredRoles
  return requiredRoles.includes(user.role.name);
};

/**
 * Redirect to login if not authenticated
 */
export const requireAuth = () => {
  if (!isAuthenticated()) {
    throw new Error('Authentication required');
  }
};

/**
 * Redirect to unauthorized if user doesn't have required role
 */
export const requireRole = (roles: string[]) => {
  requireAuth();

  if (!hasRole(roles)) {
    throw new Error('Insufficient permissions');
  }
};

/**
 * Export default
 */
export default {
  isAuthenticated,
  getCurrentUser,
  hasRole,
  requireAuth,
  requireRole,
};
