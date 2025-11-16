/**
 * Login Page
 * Authentication page for user login
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Logo } from '@/components/logo';
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
import { useUserActions } from '@/store/userStore';
import { login as loginApi } from '@/api/services/userService';
import { Icon } from '@/components/icon';
import GLOBAL_CONFIG from '@/global-config';

// Validation schema
const loginSchema = z.object({
  username: z.string().min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setUserInfo, setUserToken } = useUserActions();

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
    setIsLoading(true);

    try {
      const response = await loginApi({
        username: data.username,
        password: data.password,
      });

      // Store user info and tokens
      setUserToken({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setUserInfo(response.user);

      toast.success('تم تسجيل الدخول بنجاح');

      // Navigate to dashboard
      router.replace(GLOBAL_CONFIG.defaultRoute);
    } catch (err: any) {
      const message = err.response?.data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo and Title */}
        <div className="text-center mb-10 animate-scaleIn">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-l from-brand-600 to-brand-500 rounded-3xl text-white text-5xl font-bold shadow-2xl shadow-sky-200">
              ت
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {GLOBAL_CONFIG.appName}
          </h1>
          <p className="text-lg text-gray-600">{GLOBAL_CONFIG.appDescription}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl shadow-gray-200/50">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Icon icon="solar:lock-password-bold-duotone" size={28} className="text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                        disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? (
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
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8 animate-fadeIn">
          جميع الحقوق محفوظة © 2025 {GLOBAL_CONFIG.appName}
        </p>
      </div>
    </div>
  );
}
