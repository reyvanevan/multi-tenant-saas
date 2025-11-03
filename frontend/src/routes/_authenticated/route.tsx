import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }

    // Load current user if not already loaded
    const user = useAuthStore.getState().user
    if (!user) {
      try {
        await useAuthStore.getState().getCurrentUser()
      } catch (error) {
        console.error('Failed to load user:', error)
        // If getCurrentUser fails, user might be logged out
        throw redirect({
          to: '/sign-in',
          search: {
            redirect: location.href,
          },
        })
      }
    }
  },
  component: AuthenticatedLayout,
})
