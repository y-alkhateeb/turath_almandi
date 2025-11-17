import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BranchForm } from '@/components/BranchForm';
import { useBranches, useUpdateBranch } from '@/hooks/useBranches';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';
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
      <div className="space-y-6">
        <Alert variant="destructive">
          لم يتم العثور على الفرع المطلوب
        </Alert>
        <Button onClick={handleCancel}>
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة الفروع
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
            تعديل الفرع
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            تعديل بيانات {branch.name}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg">
        <BranchForm
          onSubmit={handleUpdate}
          onCancel={handleCancel}
          initialData={branch}
          isLoading={updateBranch.isPending}
        />
      </Card>
    </div>
  );
};

export default EditBranchPage;
