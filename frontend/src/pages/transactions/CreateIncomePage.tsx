import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TransactionFormWithInventory } from '@/components/transactions/TransactionFormWithInventory';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import type { Transaction } from '#/entity';

/**
 * Create Transaction Page
 * Full page for creating a new transaction (income or expense)
 */
export const CreateIncomePage = () => {
  const navigate = useNavigate();

  const handleSuccess = (_transaction: Transaction) => {
    // Success toast shown by form component
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
        <TransactionFormWithInventory
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateIncomePage;
