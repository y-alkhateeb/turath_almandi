import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@hooks/useAuth';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      setError(message);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-10 animate-scale-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-primary rounded-3xl mb-6 text-white text-5xl font-bold shadow-2xl shadow-sky-200">
            ت
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">تراث المندي</h1>
          <p className="text-lg text-gray-600">نظام المحاسبة للمطاعم</p>
        </div>

        {/* Login Form */}
        <div className="card p-10 shadow-2xl shadow-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2.5">
                اسم المستخدم
              </label>
              <input
                type="text"
                id="username"
                {...register('username')}
                className={`input ${
                  errors.username ? '!border-red-500' : ''
                }`}
                placeholder="أدخل اسم المستخدم"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2.5">
                كلمة المرور
              </label>
              <input
                type="password"
                id="password"
                {...register('password')}
                className={`input ${
                  errors.password ? '!border-red-500' : ''
                }`}
                placeholder="••••••••"
                disabled={isLoading}
                dir="ltr"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
                className="w-4.5 h-4.5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 focus:ring-2"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer select-none">
                تذكرني لمدة 30 يومًا
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="danger" className="animate-slide-in-right">
                {error}
              </Alert>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3.5 text-base font-semibold mt-2 flex items-center justify-center gap-3"
            >
              {isLoading && <LoadingSpinner size="sm" color="white" />}
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8 animate-fade-in">
          جميع الحقوق محفوظة © 2025 تراث المندي
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
