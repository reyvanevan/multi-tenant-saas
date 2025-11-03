/**
 * Tenant Context Store
 * Zustand store for managing tenant and outlet context
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  TenantContextState,
  Tenant,
  Outlet,
} from '@/types/tenant.types';

/**
 * Tenant Context Store
 * Manages current tenant and outlet with persistence
 */
export const useTenantStore = create<TenantContextState>()(
  persist(
    (set) => ({
      // Initial State
      currentTenantId: null,
      currentOutletId: null,
      tenant: null,
      outlet: null,
      availableTenants: [],
      availableOutlets: [],
      isLoading: false,
      error: null,

      // Switch Tenant
      switchTenant: async (tenantId: string) => {
        set({ isLoading: true, error: null });
        try {
          // This will be called from tenant.service.ts
          console.log('Switch tenant action called:', tenantId);
          set({ currentTenantId: tenantId });
          
          // Save to localStorage for API client headers
          localStorage.setItem('current_tenant_id', tenantId);
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Switch Outlet
      switchOutlet: async (outletId: string) => {
        set({ isLoading: true, error: null });
        try {
          // This will be called from tenant.service.ts
          console.log('Switch outlet action called:', outletId);
          set({ currentOutletId: outletId });
          
          // Save to localStorage for API client headers
          localStorage.setItem('current_outlet_id', outletId);
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Switch Context (Tenant + Outlet)
      switchContext: async (tenantId?: string, outletId?: string) => {
        set({ isLoading: true, error: null });
        try {
          // This will be called from tenant.service.ts
          console.log('Switch context action called:', { tenantId, outletId });
          
          if (tenantId) {
            set({ currentTenantId: tenantId });
          }
          
          if (outletId) {
            set({ currentOutletId: outletId });
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Load User Context
      loadUserContext: async () => {
        set({ isLoading: true, error: null });
        try {
          // This will be called from tenant.service.ts
          console.log('Load user context action called');
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Clear Context
      clearContext: () => {
        set({
          currentTenantId: null,
          currentOutletId: null,
          tenant: null,
          outlet: null,
          availableTenants: [],
          availableOutlets: [],
          isLoading: false,
          error: null,
        });
        
        // Clear from localStorage
        localStorage.removeItem('current_tenant_id');
        localStorage.removeItem('current_outlet_id');
        
        console.log('✅ Tenant context cleared');
      },

      // Set Current Tenant
      setCurrentTenant: (tenant: Tenant | null) => {
        set({
          tenant,
          currentTenantId: tenant?.id || null,
        });
      },

      // Set Current Outlet
      setCurrentOutlet: (outlet: Outlet | null) => {
        set({
          outlet,
          currentOutletId: outlet?.id || null,
        });
      },
    }),
    {
      name: 'tenant-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTenantId: state.currentTenantId,
        currentOutletId: state.currentOutletId,
        tenant: state.tenant,
        outlet: state.outlet,
      }),
    },
  ),
);

/**
 * Selectors for optimized component re-renders
 */
export const selectCurrentTenantId = (state: TenantContextState) =>
  state.currentTenantId;
export const selectCurrentOutletId = (state: TenantContextState) =>
  state.currentOutletId;
export const selectTenant = (state: TenantContextState) => state.tenant;
export const selectOutlet = (state: TenantContextState) => state.outlet;
export const selectIsLoading = (state: TenantContextState) => state.isLoading;
export const selectError = (state: TenantContextState) => state.error;

/**
 * Export default
 */
export default useTenantStore;
