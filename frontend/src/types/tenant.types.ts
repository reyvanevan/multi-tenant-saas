/**
 * Tenant Context Type Definitions
 * Interfaces for multi-tenant context management
 */

/**
 * Tenant Interface
 */
export interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

/**
 * Outlet Interface
 */
export interface Outlet {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

/**
 * User Context (Current Tenant & Outlet)
 */
export interface UserContext {
  currentTenantId: string | null;
  currentOutletId: string | null;
  tenant?: Tenant;
  outlet?: Outlet;
  availableTenants?: Tenant[];
  availableOutlets?: Outlet[];
}

/**
 * Switch Context Request
 */
export interface SwitchContextRequest {
  tenantId?: string;
  outletId?: string;
}

/**
 * Switch Context Response
 */
export interface SwitchContextResponse {
  message: string;
  user: {
    id: string;
    email: string;
    lastTenantId: string | null;
    lastOutletId: string | null;
  };
}

/**
 * Tenant Context State (Zustand Store)
 */
export interface TenantContextState {
  // State
  currentTenantId: string | null;
  currentOutletId: string | null;
  tenant: Tenant | null;
  outlet: Outlet | null;
  availableTenants: Tenant[];
  availableOutlets: Outlet[];
  isLoading: boolean;
  error: string | null;

  // Actions
  switchTenant: (tenantId: string) => Promise<void>;
  switchOutlet: (outletId: string) => Promise<void>;
  switchContext: (tenantId?: string, outletId?: string) => Promise<void>;
  loadUserContext: () => Promise<void>;
  clearContext: () => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  setCurrentOutlet: (outlet: Outlet | null) => void;
}


