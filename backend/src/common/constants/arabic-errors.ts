/**
 * Arabic error messages map
 * Keys are in camelCase English, values are in Arabic
 *
 * Usage: translateError('userNotAuthenticated', 'ar') => 'المستخدم غير مصادق عليه'
 */

export const ARABIC_ERRORS: Record<string, string> = {
  // Authentication & Authorization
  userNotAuthenticated: 'المستخدم غير مصادق عليه',
  unauthorized: 'غير مصرح',
  forbidden: 'ممنوع',
  invalidCredentials: 'بيانات الاعتماد غير صحيحة',
  tokenExpired: 'انتهت صلاحية الرمز',
  invalidToken: 'رمز غير صالح',
  invalidOrExpiredToken: 'الرمز غير صالح أو منتهي الصلاحية',

  // Branch Errors
  branchNotFound: 'الفرع غير موجود',
  branchRequired: 'يجب تحديد الفرع',
  userMustBeAssignedToBranch: 'يجب تعيين فرع للمستخدم',
  accountantMustBeAssignedToBranch: 'يجب تعيين المحاسب لفرع',
  accountantNotAssignedToAnyBranch: 'المحاسب غير معين لأي فرع',
  cannotAccessOtherBranches: 'لا يمكن الوصول إلى فروع أخرى',
  cannotDeleteFromOtherBranches: 'لا يمكن الحذف من فروع أخرى',
  branchIdRequired: 'معرف الفرع مطلوب',
  branchIdRequiredInRequestBody: 'معرف الفرع مطلوب في نص الطلب',

  // Transaction Errors
  transactionNotFound: 'المعاملة غير موجودة',
  noAccessToTransaction: 'ليس لديك صلاحية للوصول إلى هذه المعاملة',
  userMustBeAssignedToBranchToCreateTransactions: 'يجب تعيين فرع للمستخدم لإنشاء المعاملات',
  paymentMethodMustBeCashOrMasterForIncome: 'طريقة الدفع يجب أن تكون نقدي أو ماستر كارد للإيرادات',

  // Debt Errors
  debtNotFound: 'الدين غير موجود',
  userMustBeAssignedToBranchToCreateDebts: 'يجب تعيين فرع للمستخدم لإنشاء الديون',
  userMustBeAssignedToBranchToPayDebts: 'يجب تعيين فرع للمستخدم لسداد الديون',
  dueDateMustBeGreaterThanOrEqualToDate: 'تاريخ الاستحقاق يجب أن يكون أكبر من أو يساوي التاريخ',
  canOnlyPayDebtsFromYourBranch: 'يمكنك فقط دفع ديون فرعك',

  // Inventory Errors
  inventoryItemNotFound: 'عنصر المخزون غير موجود',
  noAccessToInventoryItem: 'ليس لديك صلاحية للوصول إلى عنصر المخزون هذا',
  userMustBeAssignedToBranchToCreateInventoryItems: 'يجب تعيين فرع للمستخدم لإنشاء عناصر المخزون',
  inventoryItemWithSameNameAndUnitAlreadyExists: 'يوجد بالفعل عنصر مخزون بنفس الاسم والوحدة في هذا الفرع',
  cannotDeleteInventoryItemWithLinkedTransactions: 'لا يمكن حذف عنصر المخزون المرتبط بمعاملات. قم بإلغاء ربط المعاملات أولاً أو اضبط الكمية على 0.',
  itemNameRequiredWhenAddingToInventory: 'اسم العنصر مطلوب عند الإضافة إلى المخزون',
  unitRequiredWhenAddingToInventory: 'الوحدة مطلوبة عند الإضافة إلى المخزون',

  // Validation Errors
  amountMustBeGreaterThan0: 'المبلغ يجب أن يكون أكبر من 0',
  quantityMustBeGreaterThan0WhenAddingToInventory: 'الكمية يجب أن تكون أكبر من 0 عند الإضافة إلى المخزون',
  quantityMustBeGreaterThanOrEqualTo0: 'الكمية يجب أن تكون أكبر من أو تساوي 0',
  costPerUnitMustBeGreaterThanOrEqualTo0: 'تكلفة الوحدة يجب أن تكون أكبر من أو تساوي 0',
  paymentAmountMustBeGreaterThan0: 'مبلغ الدفع يجب أن يكون أكبر من 0',

  // Prisma/Database Errors
  recordNotFound: 'السجل غير موجود',
  unexpectedDatabaseError: 'حدث خطأ غير متوقع في قاعدة البيانات',
  databaseValidationError: 'خطأ في التحقق من صحة البيانات',

  // Unique Constraint Violations
  recordWithThisUsernameAlreadyExists: 'يوجد بالفعل مستخدم بنفس اسم المستخدم',
  recordWithThisEmailAlreadyExists: 'يوجد بالفعل مستخدم بنفس البريد الإلكتروني',

  // Foreign Key Constraint Violations
  foreignKeyConstraintViolation: 'خطأ في ارتباط البيانات - المرجع المحدد غير موجود',
  invalidBranchReference: 'معرف الفرع المحدد غير موجود أو غير صالح',
  invalidUserReference: 'معرف المستخدم المحدد غير موجود أو غير صالح',
  invalidInventoryItemReference: 'معرف عنصر المخزون المحدد غير موجود أو غير صالح',
  invalidDebtReference: 'معرف الدين المحدد غير موجود أو غير صالح',
  invalidContactReference: 'معرف جهة الاتصال المحدد غير موجود أو غير صالح',
  invalidPayableReference: 'معرف الحساب الدائن المحدد غير موجود أو غير صالح',
  invalidReceivableReference: 'معرف الحساب المدين المحدد غير موجود أو غير صالح',

  // Contact Errors
  contactNotFound: 'جهة الاتصال غير موجودة',
  userMustBeAssignedToBranchToCreateContacts: 'يجب تعيين فرع للمستخدم لإنشاء جهات الاتصال',
  contactWithSameNameAlreadyExistsInBranch: 'يوجد بالفعل جهة اتصال بنفس الاسم في هذا الفرع',
  cannotDeleteContactWithLinkedPayables: 'لا يمكن حذف جهة اتصال مرتبطة بحسابات دائنة',
  cannotDeleteContactWithLinkedReceivables: 'لا يمكن حذف جهة اتصال مرتبطة بحسابات مدينة',
  noAccessToContact: 'ليس لديك صلاحية للوصول إلى جهة الاتصال هذه',

  // Account Payable Errors
  payableNotFound: 'الحساب الدائن غير موجود',
  userMustBeAssignedToBranchToCreatePayables: 'يجب تعيين فرع للمستخدم لإنشاء الحسابات الدائنة',
  userMustBeAssignedToBranchToPayPayables: 'يجب تعيين فرع للمستخدم لسداد الحسابات الدائنة',
  canOnlyPayPayablesFromYourBranch: 'يمكنك فقط دفع الحسابات الدائنة من فرعك',
  noAccessToPayable: 'ليس لديك صلاحية للوصول إلى هذا الحساب الدائن',
  contactIdRequiredForPayable: 'معرف جهة الاتصال مطلوب للحساب الدائن',

  // Account Receivable Errors
  receivableNotFound: 'الحساب المدين غير موجود',
  userMustBeAssignedToBranchToCreateReceivables: 'يجب تعيين فرع للمستخدم لإنشاء الحسابات المدينة',
  userMustBeAssignedToBranchToReceivePayments: 'يجب تعيين فرع للمستخدم لاستلام المدفوعات',
  canOnlyReceivePaymentsFromYourBranch: 'يمكنك فقط استلام المدفوعات من فرعك',
  noAccessToReceivable: 'ليس لديك صلاحية للوصول إلى هذا الحساب المدين',
  contactIdRequiredForReceivable: 'معرف جهة الاتصال مطلوب للحساب المدين',

  // Employee & Payroll Errors
  employeeNotFound: 'الموظف غير موجود',
  employeeIdRequiredForSalary: 'معرف الموظف مطلوب لمعاملات الرواتب',
  noAccessToEmployee: 'ليس لديك صلاحية للوصول إلى بيانات هذا الموظف',
  cannotCreateSalaryForResignedEmployee: 'لا يمكن إنشاء راتب لموظف مستقيل',
  adjustmentNotFound: 'التسوية المالية غير موجودة',
  invalidAdjustmentType: 'نوع التسوية المالية غير صالح',
  adjustmentAmountMustBePositive: 'مبلغ التسوية يجب أن يكون أكبر من صفر',
  cannotDeleteEmployeeWithAdjustments: 'لا يمكن حذف موظف لديه تسويات مالية مرتبطة',
  cannotDeleteEmployeeWithTransactions: 'لا يمكن حذف موظف لديه معاملات مالية مرتبطة',

  // Currency Errors
  onlyUSDCurrencyIsAllowed: 'العملة المسموح بها فقط هي الدولار الأمريكي',
  invalidCurrency: 'عملة غير صالحة',

  // General HTTP Errors
  badRequest: 'طلب غير صالح',
  notFound: 'غير موجود',
  conflict: 'تعارض',
  internalServerError: 'خطأ داخلي في الخادم',
  serviceUnavailable: 'الخدمة غير متاحة',
  validationFailed: 'فشل التحقق من الصحة',

  // Validation Messages
  shouldNotBeEmpty: 'يجب ألا يكون فارغاً',
  mustBeString: 'يجب أن يكون نصاً',
  mustBeNumber: 'يجب أن يكون رقماً',
  mustBeBoolean: 'يجب أن يكون قيمة منطقية',
  mustBeArray: 'يجب أن يكون مصفوفة',
  mustBeObject: 'يجب أن يكون كائن',
  mustBeValidEmail: 'يجب أن يكون بريد إلكتروني صالح',
  mustBeValidDate: 'يجب أن يكون تاريخ صالح',
  isRequired: 'مطلوب',
  isNotValid: 'غير صالح',
  field: 'حقل',
  alreadyExists: 'موجود بالفعل',

  // Field Names
  username: 'اسم المستخدم',
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
  name: 'الاسم',
  branchId: 'معرف الفرع',
  userId: 'معرف المستخدم',
  creditorName: 'اسم الدائن',
  amount: 'المبلغ',
  quantity: 'الكمية',
  itemName: 'اسم العنصر',
  unit: 'الوحدة',
  date: 'التاريخ',
  dueDate: 'تاريخ الاستحقاق',
  paymentDate: 'تاريخ الدفع',
  vendorName: 'اسم المورد',
  description: 'الوصف',
  notes: 'الملاحظات',
  contactId: 'معرف جهة الاتصال',
  contactName: 'اسم جهة الاتصال',
  contactType: 'نوع جهة الاتصال',
  taxNumber: 'الرقم الضريبي',
  address: 'العنوان',
  creditLimit: 'حد الائتمان',
  originalAmount: 'المبلغ الأصلي',
  remainingAmount: 'المبلغ المتبقي',
  status: 'الحالة',
  invoiceNumber: 'رقم الفاتورة',
} as const;

/**
 * Translate error message key to Arabic
 * @param key - The error key in camelCase English (e.g., 'userNotAuthenticated')
 * @param locale - The locale ('ar' for Arabic, 'en' for English)
 * @returns Translated message or original key if translation not found
 */
export function translateError(key: string, locale: string = 'ar'): string {
  if (locale !== 'ar') {
    return key;
  }

  // Direct match
  if (ARABIC_ERRORS[key]) {
    return ARABIC_ERRORS[key];
  }

  // Return original key if no translation found
  return key;
}

/**
 * Translate field name to Arabic
 * @param field - The field name in camelCase
 * @param locale - The locale
 */
export function translateField(field: string, locale: string = 'ar'): string {
  if (locale !== 'ar') {
    return field;
  }

  return ARABIC_ERRORS[field] || field;
}

/**
 * Create a translated error message with dynamic values
 * @param key - The error key
 * @param params - Dynamic parameters to inject
 * @param locale - The locale
 */
export function translateErrorWithParams(
  key: string,
  params: Record<string, string | number>,
  locale: string = 'ar',
): string {
  let message = translateError(key, locale);

  // Replace {param} placeholders with values
  Object.entries(params).forEach(([paramKey, value]) => {
    message = message.replace(`{${paramKey}}`, String(value));
  });

  return message;
}

/**
 * Translate validation errors array from class-validator
 * @param errors - Array of validation errors
 * @param locale - The locale
 */
export function translateValidationErrors(
  errors: Array<{ property: string; constraints?: Record<string, string> }>,
  locale: string = 'ar',
): Array<{ property: string; constraints?: Record<string, string> }> {
  if (locale !== 'ar') {
    return errors;
  }

  return errors.map((error) => ({
    property: translateField(error.property, locale),
    constraints: error.constraints
      ? Object.entries(error.constraints).reduce(
          (acc, [key, value]) => {
            acc[key] = translateError(value, locale);
            return acc;
          },
          {} as Record<string, string>,
        )
      : undefined,
  }));
}

/**
 * Extract locale from Accept-Language header
 * @param acceptLanguage - The Accept-Language header value
 * @returns The locale ('ar' or 'en')
 */
export function extractLocale(acceptLanguage?: string): string {
  if (!acceptLanguage) {
    return 'en';
  }

  // Parse Accept-Language header (e.g., "ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7")
  const primaryLanguage = acceptLanguage.split(',')[0].split('-')[0].split(';')[0].trim();

  return primaryLanguage === 'ar' ? 'ar' : 'en';
}
