import { useCallback, useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export type ToastState = {
  id: number
  type: ToastType
  message: string
}

export default function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ id: Date.now(), type, message })
  }, [])

  useEffect(() => {
    if (!toast) return

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  return { toast, showToast, dismissToast }
}
