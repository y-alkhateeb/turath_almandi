/**
 * App Settings Page
 * Page for managing app-wide settings (Admin only)
 *
 * Features:
 * - Update login background image URL
 * - Preview background image
 * - Admin-only access
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { getAppSettings, updateAppSettings } from '@/api/services/settingsService';
import type { AppSettings, UpdateAppSettingsInput } from '#/settings.types';

// Validation schema
const appSettingsSchema = z.object({
  loginBackgroundUrl: z
    .string()
    .url({ message: 'يجب أن يكون رابط صحيح' })
    .max(2000, { message: 'الرابط طويل جداً (الحد الأقصى 2000 حرف)' })
    .optional()
    .or(z.literal('')),
  appName: z
    .string()
    .max(200, { message: 'اسم التطبيق طويل جداً (الحد الأقصى 200 حرف)' })
    .optional()
    .or(z.literal('')),
  appIconUrl: z
    .string()
    .url({ message: 'يجب أن يكون رابط صحيح' })
    .max(2000, { message: 'الرابط طويل جداً (الحد الأقصى 2000 حرف)' })
    .optional()
    .or(z.literal('')),
});

type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

export default function AppSettingsPage() {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSettings, setCurrentSettings] = useState<AppSettings | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      loginBackgroundUrl: '',
      appName: '',
      appIconUrl: '',
    },
  });

  const loginBackgroundUrl = watch('loginBackgroundUrl');
  const appIconUrl = watch('appIconUrl');

  // Fetch app settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getAppSettings();
        setCurrentSettings(settings);
        reset({
          loginBackgroundUrl: settings.loginBackgroundUrl || '',
          appName: settings.appName || '',
          appIconUrl: settings.appIconUrl || '',
        });
      } catch (err) {
        setErrorMessage('فشل تحميل الإعدادات');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin, reset]);

  const onSubmit = async (data: AppSettingsFormData) => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const input: UpdateAppSettingsInput = {
        loginBackgroundUrl: data.loginBackgroundUrl || undefined,
        appName: data.appName || undefined,
        appIconUrl: data.appIconUrl || undefined,
      };

      const updated = await updateAppSettings(input);
      setCurrentSettings(updated);
      setSuccessMessage('تم حفظ الإعدادات بنجاح');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('فشل حفظ الإعدادات. يرجى المحاولة مرة أخرى');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          غير مصرح لك بالوصول إلى هذه الصفحة
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="إعدادات التطبيق"
        breadcrumbs={[
          { label: 'لوحة التحكم', path: '/dashboard' },
          { label: 'الإعدادات', path: '/settings' },
          { label: 'إعدادات التطبيق' },
        ]}
      />

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
          إعدادات التطبيق العامة
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-[var(--text-secondary)]">جاري التحميل...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {errorMessage}
              </div>
            )}

            {/* App Name */}
            <div>
              <label
                htmlFor="appName"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                اسم التطبيق
              </label>
              <input
                id="appName"
                type="text"
                {...register('appName')}
                placeholder="تراث المندي"
                className={`w-full px-4 py-3 border ${
                  errors.appName ? 'border-red-500' : 'border-[var(--border-color)]'
                } rounded-lg text-[var(--text-primary)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500`}
                disabled={isSaving}
              />
              {errors.appName && (
                <p className="mt-1 text-sm text-red-600">{errors.appName.message}</p>
              )}
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                اسم التطبيق الذي سيظهر في عنوان الصفحة والمتصفح
              </p>
            </div>

            {/* App Icon URL */}
            <div>
              <label
                htmlFor="appIconUrl"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                رابط أيقونة التطبيق (Favicon)
              </label>
              <input
                id="appIconUrl"
                type="url"
                {...register('appIconUrl')}
                placeholder="https://example.com/icon.png"
                className={`w-full px-4 py-3 border ${
                  errors.appIconUrl ? 'border-red-500' : 'border-[var(--border-color)]'
                } rounded-lg text-[var(--text-primary)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500`}
                disabled={isSaving}
                dir="ltr"
              />
              {errors.appIconUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.appIconUrl.message}</p>
              )}
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                رابط أيقونة التطبيق التي ستظهر في تبويب المتصفح
              </p>
            </div>

            {/* Icon Preview */}
            {appIconUrl && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  معاينة الأيقونة
                </label>
                <div className="flex items-center gap-4 p-4 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]">
                  <img
                    src={appIconUrl}
                    alt="معاينة أيقونة التطبيق"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.alt = 'فشل تحميل الأيقونة';
                    }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">حجم الأيقونة الموصى به: 512x512 بكسل</span>
                </div>
              </div>
            )}

            {/* Login Background URL Input */}
            <div>
              <label
                htmlFor="loginBackgroundUrl"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                رابط صورة خلفية تسجيل الدخول
              </label>
              <input
                id="loginBackgroundUrl"
                type="url"
                {...register('loginBackgroundUrl')}
                placeholder="https://example.com/image.jpg"
                className={`w-full px-4 py-3 border ${
                  errors.loginBackgroundUrl ? 'border-red-500' : 'border-[var(--border-color)]'
                } rounded-lg text-[var(--text-primary)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500`}
                disabled={isSaving}
                dir="ltr"
              />
              {errors.loginBackgroundUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.loginBackgroundUrl.message}</p>
              )}
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                أدخل رابط الصورة التي تريد عرضها كخلفية لصفحة تسجيل الدخول. إذا تركت الحقل فارغاً، سيتم
                عرض خلفية ملونة افتراضية.
              </p>
            </div>

            {/* Preview */}
            {loginBackgroundUrl && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  معاينة
                </label>
                <div className="relative w-full h-48 border border-[var(--border-color)] rounded-lg overflow-hidden">
                  <img
                    src={loginBackgroundUrl}
                    alt="معاينة صورة الخلفية"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '';
                      e.currentTarget.alt = 'فشل تحميل الصورة';
                      e.currentTarget.className = 'w-full h-full flex items-center justify-center bg-gray-100 text-gray-500';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Current Setting Info */}
            {currentSettings?.loginBackgroundUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>الرابط الحالي:</strong>{' '}
                  <a
                    href={currentSettings.loginBackgroundUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    {currentSettings.loginBackgroundUrl.substring(0, 60)}
                    {currentSettings.loginBackgroundUrl.length > 60 ? '...' : ''}
                  </a>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
