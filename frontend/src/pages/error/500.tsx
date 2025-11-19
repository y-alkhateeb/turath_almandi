/**
 * 500 Internal Server Error Page
 * Displayed when an unexpected error occurs
 */

import { useRouter } from '@/routes/hooks';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';

export default function Page500() {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-tertiary)] px-4">
      <div className="text-center">
        <div className="mb-8">
          <Icon icon="solar:server-bold-duotone" size={120} className="text-danger-500 mx-auto" />
        </div>
        <h1 className="text-6xl font-bold text-[var(--text-primary)] mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">خطأ في الخادم</h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
          عذراً، حدث خطأ غير متوقع في الخادم. يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم
          الفني.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={handleRefresh}>
            <Icon icon="solar:refresh-linear" className="ml-2" />
            تحديث الصفحة
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
