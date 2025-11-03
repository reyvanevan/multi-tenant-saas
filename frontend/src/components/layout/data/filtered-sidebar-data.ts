import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LineChart,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  Store,
  Truck,
} from 'lucide-react'
import { type SidebarData, type NavGroup } from '../types'

// Platform roles that should see platform-specific menus
const PLATFORM_ROLES = ['SUPER_ADMIN', 'DEVELOPER', 'SUPPORT', 'BILLING_ADMIN']

// Tenant roles that should see tenant-specific menus  
const TENANT_ROLES = ['ADMIN', 'CASHIER', 'MANAGER', 'ACCOUNTANT', 'VIEWER']

/**
 * Get filtered sidebar navigation based on user role
 */
export function getFilteredSidebarData(userRole?: string): NavGroup[] {
  if (!userRole) {
    return getDefaultNavGroups()
  }

  const isPlatformUser = PLATFORM_ROLES.includes(userRole)
  const isTenantUser = TENANT_ROLES.includes(userRole)

  if (isPlatformUser) {
    return getPlatformNavGroups()
  }

  if (isTenantUser) {
    return getTenantNavGroups()
  }

  // Fallback to default
  return getDefaultNavGroups()
}

/**
 * Platform admin navigation - for SUPER_ADMIN, DEVELOPER, SUPPORT, BILLING_ADMIN
 */
function getPlatformNavGroups(): NavGroup[] {
  return [
    {
      title: 'Platform',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Tenants',
          url: '/tenants',
          icon: Building2,
        },
        {
          title: 'Subscriptions',
          url: '/subscriptions',
          icon: CreditCard,
        },
        {
          title: 'Analytics',
          url: '/analytics',
          icon: LineChart,
        },
        {
          title: 'Platform Users',
          url: '/platform-users',
          icon: Users,
        },
      ],
    },
  ]
}

/**
 * Tenant navigation - for ADMIN, CASHIER, MANAGER
 */
function getTenantNavGroups(): NavGroup[] {
  return [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'POS',
          url: '/pos',
          icon: ShoppingCart,
        },
        {
          title: 'Inventory',
          url: '/inventory',
          icon: Warehouse,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: LineChart,
        },
        {
          title: 'Products',
          url: '/products',
          icon: Package,
        },
        {
          title: 'Outlets',
          url: '/outlets',
          icon: Store,
        },
        {
          title: 'Suppliers',
          url: '/suppliers',
          icon: Truck,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
      ],
    },
  ]
}

/**
 * Default navigation - shown when role is unknown or not logged in
 */
function getDefaultNavGroups(): NavGroup[] {
  return [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
  ]
}
