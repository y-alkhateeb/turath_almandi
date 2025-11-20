# دليل تنسيق التاريخ الموحد
# Date Formatting Guide

## الاستراتيجية الموحدة / Unified Strategy

جميع دوال تنسيق التاريخ موجودة في ملف واحد:
```
frontend/src/utils/format.ts
```

## الدوال المتاحة / Available Functions

### 1. `formatDate(date, locale?)`
**الاستخدام**: تنسيق التاريخ بصيغة طويلة مع أسماء الأشهر بالعربية
**الناتج**: `١٥ يناير ٢٠٢٥`
**متى تستخدمه**: في صفحات عرض التفاصيل، العناوين

```typescript
import { formatDate } from '@/utils/format';
formatDate('2025-01-15') // ١٥ يناير ٢٠٢٥
```

### 2. `formatDateShort(date)`
**الاستخدام**: تنسيق التاريخ بصيغة قصيرة DD/MM/YYYY
**الناتج**: `15/01/2025`
**متى تستخدمه**: في الإشعارات، الرسائل القصيرة

```typescript
import { formatDateShort } from '@/utils/format';
formatDateShort('2025-01-15') // 15/01/2025
```

### 3. `formatDateTable(date)` ⭐ موصى به للجداول
**الاستخدام**: تنسيق التاريخ للعرض في الجداول
**الناتج**: `٢٠٢٥/٠١/١٥` (بالأرقام العربية)
**متى تستخدمه**: **جميع الجداول وقوائم العمليات**

```typescript
import { formatDateTable } from '@/utils/format';
formatDateTable('2025-01-15') // ٢٠٢٥/٠١/١٥
```

### 4. `formatDateTime(date, locale?)`
**الاستخدام**: تنسيق التاريخ والوقت معاً
**الناتج**: `١٥ يناير ٢٠٢٥، ٣:٣٠ م`
**متى تستخدمه**: في سجلات الأحداث، التوقيتات الدقيقة

```typescript
import { formatDateTime } from '@/utils/format';
formatDateTime('2025-01-15T15:30:00') // ١٥ يناير ٢٠٢٥، ٣:٣٠ م
```

### 5. `formatRelativeTime(date, locale?)`
**الاستخدام**: تنسيق الوقت النسبي (منذ متى)
**الناتج**: `منذ ساعتين`، `منذ يومين`
**متى تستخدمه**: في الإشعارات، آخر النشاطات

```typescript
import { formatRelativeTime } from '@/utils/format';
formatRelativeTime('2025-01-15T13:00:00') // منذ ساعتين
```

### 6. `toInputDate(date)`
**الاستخدام**: تحويل التاريخ إلى صيغة input[type="date"]
**الناتج**: `2025-01-15` (YYYY-MM-DD)
**متى تستخدمه**: عند تعبئة قيم حقول التاريخ

```typescript
import { toInputDate } from '@/utils/format';
toInputDate(new Date()) // 2025-01-15
```

## دوال الأرقام / Number Formatting

### `formatAmount(amount)` ⭐ موصى به للجداول
**الاستخدام**: تنسيق المبالغ في الجداول (بدون رمز العملة)
**الناتج**: `١٥٠,٠٠٠`
**متى تستخدمه**: في الجداول حيث تُعرض العملة بشكل منفصل

```typescript
import { formatAmount } from '@/utils/format';
formatAmount(150000) // ١٥٠,٠٠٠
```

### `formatCurrency(amount, locale?)`
**الاستخدام**: تنسيق المبالغ مع رمز العملة
**الناتج**: `١٥٠,٠٠٠ د.ع`
**متى تستخدمه**: في الإحصائيات، البطاقات، الملخصات

```typescript
import { formatCurrency } from '@/utils/format';
formatCurrency(150000) // ١٥٠,٠٠٠ د.ع
```

## ❌ ممنوع / Don't Do This

### لا تنشئ دوال تنسيق محلية!

```typescript
// ❌ خطأ - لا تفعل هذا
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// ✅ صحيح - استخدم الدالة الموحدة
import { formatDateTable } from '@/utils/format';
```

### لا تستخدم تنسيقات مختلفة!

```typescript
// ❌ خطأ - تنسيقات مختلفة في صفحات مختلفة
// Page1: YYYY/MM/DD
// Page2: DD-MM-YYYY
// Page3: DD/MM/YYYY

// ✅ صحيح - استخدم formatDateTable في كل الجداول
import { formatDateTable } from '@/utils/format';
```

## أمثلة عملية / Practical Examples

### في مكون جدول

```typescript
import { formatDateTable, formatAmount } from '@/utils/format';
import { getCategoryLabel } from '@/constants/transactionCategories';

function TransactionTable({ transactions }) {
  return (
    <table>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id}>
            <td>{formatDateTable(transaction.date)}</td>
            <td>{formatAmount(transaction.amount)} {transaction.currency}</td>
            <td>{getCategoryLabel(transaction.category)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### في صفحة عرض التفاصيل

```typescript
import { formatDate, formatCurrency } from '@/utils/format';

function ViewTransaction({ transaction }) {
  return (
    <div>
      <p>التاريخ: {formatDate(transaction.date)}</p>
      <p>المبلغ: {formatCurrency(transaction.amount)}</p>
    </div>
  );
}
```

## الفوائد / Benefits

✅ **صيانة سهلة**: تعديل واحد في utils/format.ts يطبق على كل التطبيق
✅ **تناسق**: جميع الصفحات تعرض التاريخ بنفس الطريقة
✅ **لغة موحدة**: دعم كامل للعربية في كل مكان
✅ **أداء**: دوال محسّنة ومختبرة
✅ **DRY**: لا تكرار للكود

## القاعدة الذهبية / Golden Rule

> **لا تكتب دوال تنسيق جديدة. استخدم الدوال الموجودة في utils/format.ts**
>
> **Don't write new formatting functions. Use the ones in utils/format.ts**

## تحديث الكود القديم / Updating Old Code

إذا وجدت دوال تنسيق محلية في المكونات القديمة:
1. احذف الدالة المحلية
2. استورد الدالة المناسبة من `@/utils/format`
3. استبدل جميع الاستخدامات

```typescript
// قبل
const formatDate = (date) => new Date(date).toLocaleDateString('ar-IQ');

// بعد
import { formatDateTable } from '@/utils/format';
// استخدم formatDateTable مباشرة
```

---

**آخر تحديث**: 2025-01-20
**المسؤول**: نظام إدارة التراث المندائي
