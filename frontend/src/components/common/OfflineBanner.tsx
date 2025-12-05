import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-warning-500 text-warning-foreground px-4 py-2',
        'flex items-center justify-center gap-2 text-sm font-medium',
        'slide-in-from-top'
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>لا يوجد اتصال بالإنترنت</span>
    </div>
  );
}
