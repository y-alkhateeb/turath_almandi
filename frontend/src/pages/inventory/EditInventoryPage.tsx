import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { InventoryForm } from '@/components/InventoryForm';
import { useInventory } from '@/hooks/useInventory';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';

/**
 * Edit Inventory Page
 * Full page for editing an existing inventory item
 */
export const EditInventoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [], isLoading } = useInventory();

  // Find the item to edit
  const item = items.find((i) => i.id === id);

  const handleSuccess = () => {
    navigate('/inventory');
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات الصنف..." />;
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          لم يتم العثور على الصنف المطلوب
        </Alert>
        <Button onClick={handleCancel}>
          <ArrowRight className="w-4 h-4" />
          العودة إلى المخزون
        </Button>
      </div>
    );
  }

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
            تعديل صنف
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            تعديل بيانات {item.name}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg">
        <InventoryForm
          item={item}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};

export default EditInventoryPage;
