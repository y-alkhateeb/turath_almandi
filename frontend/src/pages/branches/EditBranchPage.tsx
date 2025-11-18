import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BranchForm } from '@/components/BranchForm';
import { useBranches, useUpdateBranch } from '@/hooks/useBranches';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { ErrorAlert } from '@/components/layouts';
import type { BranchFormData } from '@/types';

/**
 * Edit Branch Page
 * Full page for editing an existing branch
 */
export const EditBranchPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: branches = [], isLoading } = useBranches();
  const updateBranch = useUpdateBranch();

  // Find the branch to edit
  const branch = branches.find((b) => b.id === id);

  const handleUpdate = async (data: BranchFormData) => {
    if (!id) return;
    await updateBranch.mutateAsync({ id, data });
    navigate('/branches');
  };

  const handleCancel = () => {
    navigate('/branches');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات الفرع..." />;
  }

  if (!branch) {
    return (
      <PageLayout title="تعديل الفرع" description="الفرع غير موجود">
        <ErrorAlert error="لم يتم العثور على الفرع المطلوب" />
        <Button onClick={handleCancel} className="mt-4">
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة الفروع
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="تعديل الفرع"
      description={`تعديل بيانات ${branch.name}`}
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card padding="lg">
        <BranchForm
          onSubmit={handleUpdate}
          onCancel={handleCancel}
          initialData={branch}
          isLoading={updateBranch.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default EditBranchPage;
