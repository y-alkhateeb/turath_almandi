import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IncomeForm } from '@/components/IncomeForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';

/**
 * Create Income Page
 * Full page for creating a new income transaction
 */
export const CreateIncomePage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/income');
  };

  const handleCancel = () => {
    navigate('/income');
  };

  return (
    <PageLayout
      title="إضافة إيراد جديد"
      description="تسجيل إيراد جديد في النظام"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card padding="lg">
        <IncomeForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateIncomePage;
