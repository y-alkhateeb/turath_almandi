/**
 * App Settings Page
 * Page for managing app-wide settings (Admin only)
 *
 * Features:
 * - Update app name
 * - Upload app icon (favicon)
 * - Upload login background image
 * - Currency settings management
 * - Image upload with drag & drop
 * - Admin-only access
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { ImageUpload } from '@/components/form/ImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { getAppSettings, updateAppSettings } from '@/api/services/settingsService';
import {
  useAllCurrencies,
  useSetDefaultCurrency,
  useCreateCurrency,
} from '@/hooks/queries/useSettings';
import {
  CurrencyList,
  CurrencyChangeModal,
  AddCurrencyModal,
} from '@/components/settings';
import type { AppSettings, UpdateAppSettingsInput, CurrencyWithUsage, CreateCurrencyInput } from '#/settings.types';

// Validation schema
const appSettingsSchema = z.object({
  loginBackgroundUrl: z.string().optional().or(z.literal('')),
  appName: z
    .string()
    .max(200, { message: 'اسم التطبيق طويل جداً (الحد الأقصى 200 حرف)' })
    .optional()
    .or(z.literal('')),
  appIconUrl: z.string().optional().or(z.literal('')),
});

type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

export default function AppSettingsPage() {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentSettings, setCurrentSettings] = useState<AppSettings | null>(null);

  // Currency modal states
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyWithUsage | null>(null);

  // Currency data
  const {
    data: currencies = [],
    isLoading: currenciesLoading,
    refetch: refetchCurrencies,
  } = useAllCurrencies(isAdmin);

  // Currency mutations
  const setDefaultCurrency = useSetDefaultCurrency();
  const createCurrency = useCreateCurrency();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      loginBackgroundUrl: '',
      appName: '',
      appIconUrl: '',
    },
  });

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

  // Currency handlers
  const handleSetDefault = useCallback((currency: CurrencyWithUsage) => {
    setSelectedCurrency(currency);
    setIsChangeModalOpen(true);
  }, []);

  const handleConfirmChange = useCallback(async () => {
    if (!selectedCurrency) return;

    try {
      await setDefaultCurrency.mutateAsync({ code: selectedCurrency.code });
      await refetchCurrencies();
      setIsChangeModalOpen(false);
      setSelectedCurrency(null);
    } catch (error) {
      console.error('Failed to set default currency:', error);
    }
  }, [selectedCurrency, setDefaultCurrency, refetchCurrencies]);

  const handleCancelChange = useCallback(() => {
    setIsChangeModalOpen(false);
    setSelectedCurrency(null);
  }, []);

  const handleAddClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleAddSubmit = useCallback(
    async (data: CreateCurrencyInput) => {
      try {
        await createCurrency.mutateAsync(data);
        await refetchCurrencies();
      } catch (error) {
        console.error('Failed to create currency:', error);
        throw error;
      }
    },
    [createCurrency, refetchCurrencies]
  );

  const handleCancelAdd = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

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

            {/* App Icon Upload */}
            <Controller
              name="appIconUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onError={setErrorMessage}
                  label="أيقونة التطبيق (Favicon)"
                  description="الأيقونة التي ستظهر في تبويب المتصفح (حجم موصى به: 512x512 بكسل)"
                  disabled={isSaving}
                  maxSizeMB={2}
                />
              )}
            />

            {/* Login Background Upload */}
            <Controller
              name="loginBackgroundUrl"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onError={setErrorMessage}
                  label="صورة خلفية تسجيل الدخول"
                  description="الصورة التي ستظهر في خلفية صفحة تسجيل الدخول"
                  disabled={isSaving}
                  maxSizeMB={5}
                />
              )}
            />

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

      {/* Currency Settings Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
          إعدادات العملة
        </h2>

        {currenciesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-[var(--text-secondary)]">جاري التحميل...</p>
          </div>
        ) : (
          <CurrencyList
            currencies={currencies}
            defaultCode={currencies.find((c) => c.isDefault)?.code || ''}
            onSetDefault={handleSetDefault}
            onAdd={handleAddClick}
            isLoading={false}
          />
        )}
      </div>

      {/* Currency Change Confirmation Modal */}
      <CurrencyChangeModal
        isOpen={isChangeModalOpen}
        onClose={handleCancelChange}
        onConfirm={handleConfirmChange}
        currency={selectedCurrency}
        transactionCount={currencies.reduce(
          (sum, currency) =>
            sum +
            Number(currency.usageCount?.transactions || 0) +
            Number(currency.usageCount?.debts || 0) +
            Number(currency.usageCount?.debtPayments || 0),
          0
        )}
        isSubmitting={setDefaultCurrency.isPending}
      />

      {/* Add Currency Modal */}
      <AddCurrencyModal
        isOpen={isAddModalOpen}
        onClose={handleCancelAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={createCurrency.isPending}
      />
    </div>
  );
}
