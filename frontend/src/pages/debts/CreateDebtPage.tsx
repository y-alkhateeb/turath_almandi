import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DebtForm } from '@/components/DebtForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';

/**
 * Create Debt Page
 * Full page for creating a new debt
 */
export const CreateDebtPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/debts');
  };

  const handleCancel = () => {
    navigate('/debts');
  };

  return (
    <PageLayout
      title="إضافة دين جديد"
      description="تسجيل دين جديد في النظام"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card padding="lg">
        <DebtForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateDebtPage;
