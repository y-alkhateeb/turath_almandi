/**
 * Login Page
 * Authentication page for user login
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Checkbox } from '@/ui/checkbox';
import { Alert } from '@/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form';
import { useRouter } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/components/icon';
import GLOBAL_CONFIG from '@/global-config';

// Validation schema - matches backend validation rules
const loginSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' })
    .max(100, { message: 'اسم المستخدم يجب ألا يتجاوز 100 حرف' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();

  const form = useForm<LoginFormData>({
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
      await login({
        username: data.username,
        password: data.password,
      });

      // Small delay to ensure Zustand persist completes before navigation
      setTimeout(() => {
        router.replace(GLOBAL_CONFIG.defaultRoute);
      }, 100);
    } catch (err: any) {
      // Error toast already shown by API interceptor or hook
      const message = err.message || 'حدث خطأ أثناء تسجيل الدخول';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-[var(--bg-secondary)]">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Title */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">مرحباً بعودتك</h1>
            <p className="text-[var(--text-secondary)]">سجل دخولك لمتابعة العمل</p>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Username Input */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="أدخل اسم المستخدم"
                        disabled={isLoggingIn}
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Input */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoggingIn}
                        autoComplete="current-password"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember Me Checkbox */}
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoggingIn}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      تذكرني لمدة 30 يومًا
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="animate-slideInRight">
                  <Icon icon="solar:danger-circle-bold" className="h-4 w-4" />
                  <span>{error}</span>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3.5 text-base font-semibold"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" className="ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:login-3-bold-duotone" className="ml-2" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer Note */}
          <p className="text-center text-sm text-[var(--text-secondary)] mt-8">
            جميع الحقوق محفوظة © 2025 {GLOBAL_CONFIG.appName}
          </p>
        </div>
      </div>

      {/* Right Side - Image/Gradient */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background Image or Gradient */}
        {!GLOBAL_CONFIG.useFallbackGradient ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${GLOBAL_CONFIG.loginBackgroundImage})` }}
          />
        ) : (
          <>
            {/* Gradient Background (Fallback) */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700"></div>
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 right-20 w-72 h-72 bg-[var(--bg-secondary)] rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-[var(--bg-secondary)] rounded-full blur-3xl"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
