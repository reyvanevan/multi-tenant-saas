/**
 * Authentication Type Definitions
 * Interfaces matching backend API responses
 */

/**
 * User Role enum
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  ACCOUNTANT = 'ACCOUNTANT',
}

/**
 * User Status enum
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Role object from backend
 */
export interface Role {
  id: string;
  name: string;
  level: number;
  permissions: string[];
  isSystem: boolean;
}

/**
 * User Interface
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: Role;
  roleId: string;
  status: UserStatus;
  tenantId: string | null;
  outletId?: string | null;
  lastTenantId?: string | null;
  lastOutletId?: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

/**
 * Login Request
 */
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  tenantName: string; // For creating new tenant
}

/**
 * Auth Response (Login/Register)
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh Token Response
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Change Password Request
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * User Context Response (Tenant & Outlet info)
 */
export interface UserContextResponse {
  user: User;
  currentTenant: {
    id: string;
    name: string;
    slug: string;
  };
  currentOutlet?: {
    id: string;
    name: string;
    address?: string;
  } | null;
  availableTenants: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  availableOutlets: Array<{
    id: string;
    name: string;
    tenantId: string;
  }>;
}

/**
 * Switch Context Request
 */
export interface SwitchContextRequest {
  tenantId?: string;
  outletId?: string;
}

/**
 * Auth Store State Interface
 */
export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}
