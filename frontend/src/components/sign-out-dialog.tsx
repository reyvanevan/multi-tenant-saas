import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)

    try {
      console.log('🚪 Signing out...')

      // Call logout service
      await authService.logout()

      console.log('✅ Sign out successful')

      // Show success toast
      toast.success('Signed out successfully')

      // Close dialog
      onOpenChange(false)

      // Redirect to login
      navigate({
        to: '/sign-in',
        replace: true,
      })
    } catch (error: any) {
      console.error('❌ Sign out failed:', error)

      // Show error toast but still redirect
      toast.error('Sign out failed, please try again')

      // Still redirect to login
      navigate({
        to: '/sign-in',
        replace: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText={isLoading ? 'Signing out...' : 'Sign out'}
      destructive
      handleConfirm={handleSignOut}
      isLoading={isLoading}
      className='sm:max-w-sm'
    />
  )
}
