import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { UserForm } from '@/components/UserForm';
import { useUsers, useUpdateUser } from '@/hooks/useUsers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { PageLayout } from '@/components/layouts';
import { ErrorAlert } from '@/components/layouts';
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
      <PageLayout title="تعديل المستخدم" description="المستخدم غير موجود">
        <ErrorAlert error="لم يتم العثور على المستخدم المطلوب" />
        <Button onClick={handleCancel} className="mt-4">
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة المستخدمين
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="تعديل المستخدم"
      description={`تعديل بيانات ${user.username}`}
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
          onSubmit={handleUpdate}
          onCancel={handleCancel}
          initialData={user}
          isLoading={updateUser.isPending}
        />
      </Card>
    </PageLayout>
  );
};

export default EditUserPage;
