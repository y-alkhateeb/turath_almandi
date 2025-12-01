/**
 * CreateIncomePage - صفحة إضافة إيراد جديد
 * صفحة مخصصة للإيرادات فقط مع تصميم محسن
 */

import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import UnifiedTransactionForm from '@/components/transactions/UnifiedTransactionForm';

export const CreateIncomePage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/transactions');
  };

  const handleCancel = () => {
    navigate('/transactions');
  };

  return (
    <PageLayout
      title="إضافة وارد جديد"
      description="تسجيل وارد جديد في صندوق الفرع"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Header Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-full">
          <Icon icon="solar:hand-money-bold-duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            واردات صندوق
          </span>
        </div>
      </div>

      {/* Form */}
      <UnifiedTransactionForm
        type="INCOME"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageLayout>
  );
};

export default CreateIncomePage;
