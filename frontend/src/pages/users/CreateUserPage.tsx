import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { UserForm } from '@/components/UserForm';
import { useCreateUser } from '@/hooks/useUsers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import type { CreateUserDto } from '@/types';

/**
 * Create User Page
 * Full page for creating a new user
 */
export const CreateUserPage = () => {
  const navigate = useNavigate();
  const createUser = useCreateUser();

  const handleCreate = async (data: CreateUserDto) => {
    await createUser.mutateAsync(data);
    navigate('/users');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  return (
    <PageLayout
      title="إضافة مستخدم جديد"
      description="إنشاء حساب مستخدم جديد في النظام"
      actions={
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
      }
    >
      {/* Form Card */}
      <Card padding="lg">
        <UserForm
          onSubmit={handleCreate}
          onCancel={handleCancel}
          isLoading={createUser.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default CreateUserPage;
