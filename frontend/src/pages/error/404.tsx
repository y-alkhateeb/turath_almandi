/**
 * 404 Not Found Page
 * Displayed when user navigates to a non-existent route
 */

import { useRouter } from '@/routes/hooks';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';

export default function Page404() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-tertiary)] px-4">
      <div className="text-center">
        <div className="mb-8">
          <Icon
            icon="solar:file-corrupted-bold-duotone"
            size={120}
            className="text-warning-500 mx-auto"
          />
        </div>
        <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
          عذراً، الصفحة التي تبحث عنها غير موجودة. ربما تم نقلها أو حذفها.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.back()}>
            <Icon icon="solar:arrow-right-linear" className="ml-2" />
            العودة
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <Icon icon="solar:home-2-linear" className="ml-2" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
