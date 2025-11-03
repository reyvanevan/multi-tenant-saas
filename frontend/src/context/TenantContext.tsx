import React, { createContext, useContext, useEffect } from 'react';
import { useTenantStore } from '@/stores/tenant-store';
import type { TenantContextState } from '@/types/tenant.types';

// Create context
const TenantContext = createContext<TenantContextState | undefined>(undefined);

interface TenantProviderProps {
  children: React.ReactNode;
}

/**
 * TenantProvider wraps the app and provides tenant context to all components.
 * It automatically loads user context on mount if user is authenticated.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const tenantStore = useTenantStore();

  useEffect(() => {
    // Load user context on mount if access token exists
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      console.log('🏢 Loading user tenant context...');
      tenantStore.loadUserContext();
    }
  }, []);

  return (
    <TenantContext.Provider value={tenantStore}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to access tenant context in components.
 * Throws error if used outside TenantProvider.
 * 
 * @example
 * ```tsx
 * const { currentTenantId, currentOutletId, switchTenant } = useTenantContext();
 * 
 * // Switch tenant
 * await switchTenant('tenant-123');
 * 
 * // Check current context
 * if (currentTenantId) {
 *   console.log('Current tenant:', currentTenantId);
 * }
 * ```
 */
export function useTenantContext(): TenantContextState {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  
  return context;
}

/**
 * Hook to get only tenant switching functions.
 * Useful when you only need actions, not state.
 */
export function useTenantActions() {
  const { switchTenant, switchOutlet, switchContext, loadUserContext, clearContext } = useTenantContext();
  
  return {
    switchTenant,
    switchOutlet,
    switchContext,
    loadUserContext,
    clearContext,
  };
}

/**
 * Hook to get current tenant and outlet IDs.
 * Returns null if not set.
 */
export function useCurrentContext() {
  const { currentTenantId, currentOutletId, tenant, outlet } = useTenantContext();
  
  return {
    tenantId: currentTenantId,
    outletId: currentOutletId,
    tenant,
    outlet,
  };
}
