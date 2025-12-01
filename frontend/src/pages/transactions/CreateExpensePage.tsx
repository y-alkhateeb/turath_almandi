/**
 * CreateExpensePage - صفحة إضافة مصروف جديد
 * صفحة مخصصة للمصروفات فقط مع تصميم محسن
 */

import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import UnifiedTransactionForm from '@/components/transactions/UnifiedTransactionForm';

export const CreateExpensePage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/transactions');
  };

  const handleCancel = () => {
    navigate('/transactions');
  };

  return (
    <PageLayout
      title="إضافة مصروف جديد"
      description="تسجيل صرفية جديدة في صندوق الفرع"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Header Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-full">
          <Icon icon="solar:wallet-money-bold-duotone" className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            صرفيات الصندوق
          </span>
        </div>
      </div>

      {/* Form */}
      <UnifiedTransactionForm
        type="EXPENSE"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageLayout>
  );
};

export default CreateExpensePage;
