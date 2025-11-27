import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { InventoryForm } from '@/components/InventoryForm';
import { useInventoryItem } from '@/hooks/useInventory';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { ErrorAlert } from '@/components/layouts';

/**
 * Edit Inventory Page
 * Full page for editing an existing inventory item
 */
export const EditInventoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, refetch, error } = useInventoryItem(id!);

  const handleSuccess = () => {
    navigate('/inventory');
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات الصنف..." />;
  }

  if (error || !item) {
    return (
      <PageLayout title="تعديل صنف" description="الصنف غير موجود">
        <ErrorAlert error="لم يتم العثور على الصنف المطلوب" />
        <Button onClick={handleCancel} className="mt-4">
          <ArrowRight className="w-4 h-4" />
          العودة إلى المخزون
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="تعديل صنف"
      description={`تعديل بيانات ${item.name}`}
      onRetry={() => refetch()}
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card className="p-8">
        <InventoryForm item={item} onSuccess={handleSuccess} onCancel={handleCancel} />
      </Card>
    </PageLayout>
  );
};

export default EditInventoryPage;
