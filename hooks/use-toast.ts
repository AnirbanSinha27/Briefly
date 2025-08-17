import { useState } from "react"

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([])

  const toast = (message: string, options?: { type?: "success" | "error" | "info" }) => {
    const id = Date.now()
    const newToast = { id, message, type: options?.type || "info" }
    setToasts(prev => [...prev, newToast])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }

  return { toast, toasts }
}
