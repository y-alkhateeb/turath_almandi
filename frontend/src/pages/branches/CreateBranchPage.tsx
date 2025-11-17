import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BranchForm } from '@/components/BranchForm';
import { useCreateBranch } from '@/hooks/useBranches';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
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
            إضافة فرع جديد
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            أضف فرع جديد إلى المؤسسة
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg">
        <BranchForm
          onSubmit={handleCreate}
          onCancel={handleCancel}
          isLoading={createBranch.isPending}
        />
      </Card>
    </div>
  );
};

export default CreateBranchPage;
