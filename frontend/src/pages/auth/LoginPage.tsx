import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Alert } from '@/ui/alert';
import { Button } from '@/ui/button';
import { FormInput } from '@/components/form/FormInput';
import { FormCheckbox } from '@/components/form/FormCheckbox';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      await login(data);
      // Small delay to ensure Zustand persist completes before navigation
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      const message = err.response?.data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo and Title */}
          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl mb-4 text-white text-3xl font-bold shadow-lg">
              ت
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بعودتك</h1>
            <p className="text-gray-600">سجل دخولك لمتابعة العمل</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
            <FormInput
              name="username"
              label="اسم المستخدم"
              type="text"
              placeholder="أدخل اسم المستخدم"
              register={register}
              error={errors.username}
              disabled={isLoading}
              className="mb-4"
            />

            <FormInput
              name="password"
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              register={register}
              error={errors.password}
              disabled={isLoading}
              className="mb-4"
            />

            <FormCheckbox
              name="rememberMe"
              label="تذكرني لمدة 30 يومًا"
              register={register}
              error={errors.rememberMe}
              disabled={isLoading}
              className="mb-4"
            />

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="animate-slide-in-right mb-4">
                {error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="default"
              className="w-full py-3 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 mt-8">
            جميع الحقوق محفوظة © 2025 تراث المندي
          </p>
        </div>
      </div>

      {/* Right Side - Image/Gradient */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-white text-center max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-6 text-white text-5xl font-bold">
              ت
            </div>
            <h2 className="text-4xl font-bold mb-4">تراث المندي</h2>
            <p className="text-xl text-white/90 mb-8">نظام المحاسبة الشامل للمطاعم</p>
          </div>

          <div className="space-y-4 text-right">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">إدارة شاملة</h3>
                <p className="text-white/80">إدارة الفروع والموظفين والمخزون بكفاءة عالية</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">تقارير دقيقة</h3>
                <p className="text-white/80">تحليلات مالية ومحاسبية شاملة ودقيقة</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">أمان عالي</h3>
                <p className="text-white/80">حماية بياناتك بأحدث معايير الأمان</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
