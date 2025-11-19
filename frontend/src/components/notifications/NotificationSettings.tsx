/**
 * NotificationSettings - Presentational Component
 * Form for configuring notification preferences
 *
 * Features:
 * - Toggle for each notification type
 * - Minimum amount input (for amount-based notifications)
 * - Multi-select for branches
 * - Display method selector (POPUP/TOAST/EMAIL/SMS)
 * - Save button
 * - Arabic labels and descriptions
 * - Loading state
 * - RTL support
 * - No business logic
 */

import { useState } from 'react';
import { Bell, DollarSign, CheckCircle } from 'lucide-react';
import { NotificationType, DisplayMethod } from '@/types/enum';
import type { NotificationSettings, UpdateNotificationSettingsInput, Branch } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface NotificationSettingsProps {
  settings: NotificationSettings[];
  branches: Branch[];
  onSave: (settings: UpdateNotificationSettingsInput[]) => Promise<void>;
  isSubmitting: boolean;
}

// ============================================
// HELPER TYPES
// ============================================

interface NotificationTypeConfig {
  type: NotificationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAmount: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Notification type configurations
 */
const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    type: NotificationType.OVERDUE_DEBT,
    label: 'ديون متأخرة',
    description: 'إشعار عند تجاوز الدين لتاريخ الاستحقاق',
    icon: Bell,
    requiresAmount: false,
  },
  {
    type: NotificationType.NEW_DEBT,
    label: 'دين جديد',
    description: 'إشعار عند إنشاء دين جديد',
    icon: Bell,
    requiresAmount: true,
  },
  {
    type: NotificationType.DEBT_PAYMENT,
    label: 'دفعة دين',
    description: 'إشعار عند تسجيل دفعة على دين',
    icon: DollarSign,
    requiresAmount: true,
  },
  {
    type: NotificationType.DEBT_PAID,
    label: 'دين مدفوع بالكامل',
    description: 'إشعار عند دفع دين بالكامل',
    icon: CheckCircle,
    requiresAmount: false,
  },
  {
    type: NotificationType.LARGE_TRANSACTION,
    label: 'معاملة كبيرة',
    description: 'إشعار عند تسجيل معاملة كبيرة',
    icon: DollarSign,
    requiresAmount: true,
  },
  {
    type: NotificationType.BACKUP_REMINDER,
    label: 'تذكير النسخ الاحتياطي',
    description: 'تذكير دوري للنسخ الاحتياطي',
    icon: Bell,
    requiresAmount: false,
  },
];

/**
 * Display method options
 */
const DISPLAY_METHOD_OPTIONS = [
  { value: DisplayMethod.POPUP, label: 'نافذة منبثقة' },
  { value: DisplayMethod.TOAST, label: 'إشعار منبثق' },
  { value: DisplayMethod.EMAIL, label: 'بريد إلكتروني' },
  { value: DisplayMethod.SMS, label: 'رسالة نصية' },
];

// ============================================
// COMPONENT
// ============================================

export function NotificationSettings({
  settings,
  branches,
  onSave,
  isSubmitting,
}: NotificationSettingsProps) {
  // Local state for form data
  const [formData, setFormData] = useState<Record<string, UpdateNotificationSettingsInput>>(() => {
    const initialData: Record<string, UpdateNotificationSettingsInput> = {};

    NOTIFICATION_TYPES.forEach((typeConfig) => {
      const existingSetting = settings.find((s) => s.notificationType === typeConfig.type);

      initialData[typeConfig.type] = {
        notificationType: typeConfig.type,
        isEnabled: existingSetting?.isEnabled ?? true,
        minAmount: existingSetting?.minAmount ?? undefined,
        selectedBranches: existingSetting?.selectedBranches ?? [],
        displayMethod: existingSetting?.displayMethod ?? DisplayMethod.TOAST,
      };
    });

    return initialData;
  });

  // Handle toggle change
  const handleToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        isEnabled: !prev[type].isEnabled,
      },
    }));
  };

  // Handle min amount change
  const handleMinAmountChange = (type: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        minAmount: numValue,
      },
    }));
  };

  // Handle display method change
  const handleDisplayMethodChange = (type: string, method: DisplayMethod) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        displayMethod: method,
      },
    }));
  };

  // Handle branch selection
  const handleBranchToggle = (type: string, branchId: string) => {
    setFormData((prev) => {
      const currentBranches = prev[type].selectedBranches || [];
      const newBranches = currentBranches.includes(branchId)
        ? currentBranches.filter((id) => id !== branchId)
        : [...currentBranches, branchId];

      return {
        ...prev,
        [type]: {
          ...prev[type],
          selectedBranches: newBranches,
        },
      };
    });
  };

  // Handle select all branches
  const handleSelectAllBranches = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        selectedBranches: branches.map((b) => b.id),
      },
    }));
  };

  // Handle deselect all branches
  const handleDeselectAllBranches = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        selectedBranches: [],
      },
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert formData to array
    const settingsArray = Object.values(formData);

    await onSave(settingsArray);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {NOTIFICATION_TYPES.map((typeConfig) => {
        const typeSetting = formData[typeConfig.type];
        const Icon = typeConfig.icon;

        return (
          <div
            key={typeConfig.type}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
          >
            {/* Header: Toggle and Title */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {typeConfig.label}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">{typeConfig.description}</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => handleToggle(typeConfig.type)}
                disabled={isSubmitting}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  ${typeSetting.isEnabled ? 'bg-primary-600' : 'bg-gray-300'}
                  ${isSubmitting && 'opacity-50 cursor-not-allowed'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${typeSetting.isEnabled ? 'translate-x-1' : 'translate-x-6'}
                  `}
                />
              </button>
            </div>

            {/* Settings (shown only when enabled) */}
            {typeSetting.isEnabled && (
              <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                {/* Minimum Amount */}
                {typeConfig.requiresAmount && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      الحد الأدنى للمبلغ (اختياري)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={typeSetting.minAmount ?? ''}
                      onChange={(e) => handleMinAmountChange(typeConfig.type, e.target.value)}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      سيتم إرسال الإشعار فقط إذا كان المبلغ أكبر من أو يساوي هذا الحد
                    </p>
                  </div>
                )}

                {/* Display Method */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    طريقة العرض
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DISPLAY_METHOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleDisplayMethodChange(typeConfig.type, option.value)}
                        disabled={isSubmitting}
                        className={`
                          px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                          ${
                            typeSetting.displayMethod === option.value
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                          }
                          ${isSubmitting && 'opacity-50 cursor-not-allowed'}
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Branch Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--text-primary)]">
                      الفروع
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllBranches(typeConfig.type)}
                        disabled={isSubmitting}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                      >
                        تحديد الكل
                      </button>
                      <span className="text-xs text-[var(--text-tertiary)]">•</span>
                      <button
                        type="button"
                        onClick={() => handleDeselectAllBranches(typeConfig.type)}
                        disabled={isSubmitting}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                      >
                        إلغاء الكل
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {branches.map((branch) => {
                      const isSelected = typeSetting.selectedBranches?.includes(branch.id) ?? false;

                      return (
                        <label
                          key={branch.id}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
                            ${
                              isSelected
                                ? 'bg-primary-50 border-primary-300'
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                            }
                            ${isSubmitting && 'opacity-50 cursor-not-allowed'}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleBranchToggle(typeConfig.type, branch.id)}
                            disabled={isSubmitting}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-[var(--text-primary)]">{branch.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  {(typeSetting.selectedBranches?.length === 0 ||
                    !typeSetting.selectedBranches) && (
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      لم يتم تحديد أي فرع - سيتم إرسال الإشعارات لجميع الفروع
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          حفظ الإعدادات
        </button>
      </div>
    </form>
  );
}

export default NotificationSettings;
