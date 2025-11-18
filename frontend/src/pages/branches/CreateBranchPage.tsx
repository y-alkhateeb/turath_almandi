import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BranchForm } from '@/components/BranchForm';
import { useCreateBranch } from '@/hooks/useBranches';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import type { BranchFormData } from '@/types';

/**
 * Create Branch Page
 * Full page for creating a new branch
 */
export const CreateBranchPage = () => {
  const navigate = useNavigate();
  const createBranch = useCreateBranch();

  const handleCreate = async (data: BranchFormData) => {
    await createBranch.mutateAsync(data);
    navigate('/branches');
  };

  const handleCancel = () => {
    navigate('/branches');
  };

  return (
    <PageLayout
      title="إضافة فرع جديد"
      description="أضف فرع جديد إلى المؤسسة"
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
          onSubmit={handleCreate}
          onCancel={handleCancel}
          isLoading={createBranch.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateBranchPage;
