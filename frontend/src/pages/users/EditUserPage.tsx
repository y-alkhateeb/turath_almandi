import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { UserForm } from '@/components/UserForm';
import { useUsers, useUpdateUser } from '@/hooks/useUsers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';
import type { CreateUserDto } from '@/types';

/**
 * Edit User Page
 * Full page for editing an existing user
 */
export const EditUserPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: users = [], isLoading } = useUsers();
  const updateUser = useUpdateUser();

  // Find the user to edit
  const user = users.find((u) => u.id === id);

  const handleUpdate = async (data: CreateUserDto) => {
    if (!id) return;
    await updateUser.mutateAsync({ id, data });
    navigate('/users');
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات المستخدم..." />;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          لم يتم العثور على المستخدم المطلوب
        </Alert>
        <Button onClick={handleCancel}>
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة المستخدمين
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
            تعديل المستخدم
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            تعديل بيانات {user.username}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card padding="lg">
        <UserForm
          onSubmit={handleUpdate}
          onCancel={handleCancel}
          initialData={user}
          isLoading={updateUser.isPending}
        />
      </Card>
    </div>
  );
};

export default EditUserPage;
