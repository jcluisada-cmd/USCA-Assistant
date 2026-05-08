import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-600 text-navy-900 text-center text-xs font-medium py-1 px-2"
    >
      Mode hors ligne — données packagées avec l'application.
    </div>
  )
}
