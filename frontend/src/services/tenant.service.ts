/**
 * Tenant Service
 * Handles all tenant-related API calls
 */

import apiClient from '@/lib/api-client';
import { useTenantStore } from '@/stores/tenant-store';
import type {
  SwitchContextRequest,
  SwitchContextResponse,
  UserContext,
} from '@/types/tenant.types';

/**
 * Tenant Service
 */
export const tenantService = {
  /**
   * Switch tenant context
   */
  async switchTenant(tenantId: string): Promise<SwitchContextResponse> {
    try {
      console.log('🏢 Switching tenant to:', tenantId);

      const response = await apiClient.post<SwitchContextResponse>(
        '/auth/switch-context',
        { tenantId } as SwitchContextRequest,
      );

      // Update tenant store
      useTenantStore.getState().switchTenant(tenantId);

      console.log('✅ Tenant switched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Switch tenant failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to switch tenant',
      );
    }
  },

  /**
   * Switch outlet context
   */
  async switchOutlet(outletId: string): Promise<SwitchContextResponse> {
    try {
      console.log('🏪 Switching outlet to:', outletId);

      const response = await apiClient.post<SwitchContextResponse>(
        '/auth/switch-context',
        { outletId } as SwitchContextRequest,
      );

      // Update tenant store
      useTenantStore.getState().switchOutlet(outletId);

      console.log('✅ Outlet switched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Switch outlet failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to switch outlet',
      );
    }
  },

  /**
   * Switch both tenant and outlet context
   */
  async switchContext(
    tenantId?: string,
    outletId?: string,
  ): Promise<SwitchContextResponse> {
    try {
      console.log('🔄 Switching context:', { tenantId, outletId });

      const response = await apiClient.post<SwitchContextResponse>(
        '/auth/switch-context',
        { tenantId, outletId } as SwitchContextRequest,
      );

      // Update tenant store
      useTenantStore.getState().switchContext(tenantId, outletId);

      console.log('✅ Context switched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Switch context failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to switch context',
      );
    }
  },

  /**
   * Get user context (current tenant & outlet)
   */
  async getUserContext(): Promise<UserContext> {
    try {
      console.log('📍 Fetching user context...');

      const response = await apiClient.get<UserContext>('/auth/context');

      // Update tenant store with context data
      const { currentTenantId, currentOutletId, tenant, outlet } =
        response.data;

      if (currentTenantId) {
        useTenantStore.getState().switchTenant(currentTenantId);
      }

      if (currentOutletId) {
        useTenantStore.getState().switchOutlet(currentOutletId);
      }

      if (tenant) {
        useTenantStore.getState().setCurrentTenant(tenant);
      }

      if (outlet) {
        useTenantStore.getState().setCurrentOutlet(outlet);
      }

      console.log('✅ User context loaded:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Get user context failed:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to load user context',
      );
    }
  },

  /**
   * Clear tenant context (logout)
   */
  clearContext(): void {
    useTenantStore.getState().clearContext();
    console.log('✅ Tenant context cleared');
  },

  /**
   * Get current tenant ID
   */
  getCurrentTenantId(): string | null {
    return useTenantStore.getState().currentTenantId;
  },

  /**
   * Get current outlet ID
   */
  getCurrentOutletId(): string | null {
    return useTenantStore.getState().currentOutletId;
  },
};

/**
 * Export default
 */
export default tenantService;
