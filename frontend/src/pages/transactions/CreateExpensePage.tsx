/**
 * CreateExpensePage - صفحة إضافة مصروف جديد
 * صفحة مخصصة للمصروفات فقط مع تصميم محسن
 */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { TransactionFormRedesigned } from '@/components/transactions/TransactionFormRedesigned';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import type { Transaction } from '#/entity';

export const CreateExpensePage = () => {
  const navigate = useNavigate();

  const handleSuccess = (_transaction: Transaction) => {
    navigate('/transactions/list');
  };

  const handleCancel = () => {
    navigate('/transactions/list');
  };

  return (
    <PageLayout
      title="إضافة مصروف جديد"
      description="تسجيل صرفية جديدة في صندوق الفرع"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Header Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-full">
          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            صرفيات الصندوق
          </span>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6 sm:p-8">
        <TransactionFormRedesigned
          transactionType="EXPENSE"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateExpensePage;
