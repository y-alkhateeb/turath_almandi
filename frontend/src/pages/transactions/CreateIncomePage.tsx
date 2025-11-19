import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { CreateTransactionInput } from '#/entity';

/**
 * Create Transaction Page
 * Full page for creating a new transaction (income or expense)
 */
export const CreateIncomePage = () => {
  const navigate = useNavigate();
  const createTransaction = useCreateTransaction();

  const handleSubmit = async (data: CreateTransactionInput) => {
    await createTransaction.mutateAsync(data);
    navigate('/transactions/list');
  };

  const handleCancel = () => {
    navigate('/transactions/list');
  };

  return (
    <PageLayout
      title="إضافة عملية جديدة"
      description="تسجيل إيراد أو مصروف جديد في النظام"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card padding="lg">
        <TransactionForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createTransaction.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateIncomePage;
