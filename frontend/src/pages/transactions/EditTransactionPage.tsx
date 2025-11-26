import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { ErrorAlert } from '@/components/layouts';
import type { UpdateTransactionInput } from '#/entity';

/**
 * Edit Transaction Page
 * Full page for editing a transaction
 */
export const EditTransactionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: transaction, isLoading, refetch } = useTransaction(id!);
  const updateTransaction = useUpdateTransaction();

  const handleSubmit = async (data: UpdateTransactionInput) => {
    if (!id) return;
    await updateTransaction.mutateAsync({ id, data });
    navigate('/transactions/list');
  };

  const handleCancel = () => {
    navigate('/transactions/list');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات العملية..." />;
  }

  if (!transaction) {
    return (
      <PageLayout title="تعديل العملية" description="العملية غير موجودة">
        <ErrorAlert error="لم يتم العثور على العملية المطلوبة" />
        <Button onClick={handleCancel} className="mt-4">
          <ArrowRight className="w-4 h-4" />
          العودة إلى العمليات
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="تعديل العملية"
      description="تعديل بيانات العملية المالية"
      onRetry={() => refetch()}
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Edit Form Card */}
      <Card className="p-8">
        <TransactionForm
          mode="edit"
          initialData={transaction}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateTransaction.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default EditTransactionPage;
