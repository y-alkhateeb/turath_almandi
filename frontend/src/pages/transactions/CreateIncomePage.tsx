import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IncomeForm } from '@/components/IncomeForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            إضافة إيراد جديد
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            تسجيل إيراد جديد في النظام
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg">
        <IncomeForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};

export default CreateIncomePage;
