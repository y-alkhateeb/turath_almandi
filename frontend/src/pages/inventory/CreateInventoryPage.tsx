import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { InventoryForm } from '@/components/InventoryForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';

/**
 * Create Inventory Page
 * Full page for creating a new inventory item
 */
export const CreateInventoryPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/inventory');
  };

  const handleCancel = () => {
    navigate('/inventory');
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
            إضافة صنف جديد
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            إضافة صنف جديد إلى المخزون
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg">
        <InventoryForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};

export default CreateInventoryPage;
