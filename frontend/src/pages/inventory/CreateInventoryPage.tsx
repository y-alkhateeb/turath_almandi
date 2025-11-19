import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { InventoryForm } from '@/components/InventoryForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';

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
    <PageLayout
      title="إضافة صنف جديد"
      description="إضافة صنف جديد إلى المخزون"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card padding="lg">
        <InventoryForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </Card>
    </PageLayout>
  );
};

export default CreateInventoryPage;
