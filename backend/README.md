# Backend - تراث المندي

الخادم الخلفي لنظام محاسبة تراث المندي
Backend server for Turath Al-Mandi Accounting System

## 🚧 قيد التطوير / Under Development

سيتم إضافة الخادم الخلفي قريباً باستخدام إحدى التقنيات التالية:
Backend will be added soon using one of the following technologies:

### خيارات التقنيات المقترحة / Proposed Tech Options:

#### خيار 1: Node.js + Express
```
- Node.js + Express
- TypeScript
- PostgreSQL / MySQL
- Prisma ORM
- JWT Authentication
```

#### خيار 2: NestJS
```
- NestJS Framework
- TypeScript
- PostgreSQL / MySQL
- TypeORM / Prisma
- Passport JWT
```

#### خيار 3: Python + FastAPI
```
- FastAPI
- Python 3.11+
- PostgreSQL / MySQL
- SQLAlchemy
- JWT Authentication
```

---

## 📋 متطلبات API المخطط لها / Planned API Requirements

### المصادقة / Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `POST /api/auth/refresh` - تحديث الرمز
- `GET /api/auth/me` - معلومات المستخدم الحالي

### المبيعات / Sales
- `GET /api/sales` - قائمة المبيعات
- `POST /api/sales` - إضافة عملية بيع
- `GET /api/sales/:id` - تفاصيل عملية بيع
- `PUT /api/sales/:id` - تعديل عملية بيع
- `DELETE /api/sales/:id` - حذف عملية بيع

### المشتريات / Purchases
- `GET /api/purchases` - قائمة المشتريات
- `POST /api/purchases` - إضافة عملية شراء
- `GET /api/purchases/:id` - تفاصيل عملية شراء
- `PUT /api/purchases/:id` - تعديل عملية شراء
- `DELETE /api/purchases/:id` - حذف عملية شراء

### المخزون / Inventory
- `GET /api/inventory` - قائمة المخزون
- `POST /api/inventory` - إضافة صنف
- `GET /api/inventory/:id` - تفاصيل صنف
- `PUT /api/inventory/:id` - تعديل صنف
- `DELETE /api/inventory/:id` - حذف صنف

### التقارير / Reports
- `GET /api/reports/sales` - تقرير المبيعات
- `GET /api/reports/purchases` - تقرير المشتريات
- `GET /api/reports/inventory` - تقرير المخزون
- `GET /api/reports/financial` - التقرير المالي

---

## 🗄️ نموذج قاعدة البيانات / Database Schema

```sql
-- سيتم إضافة نماذج قاعدة البيانات هنا
-- Database schemas will be added here

-- Users (المستخدمون)
-- Products (المنتجات)
-- Sales (المبيعات)
-- Purchases (المشتريات)
-- Inventory (المخزون)
-- Transactions (المعاملات)
```

---

## 🔜 القادم / Coming Soon

تابع هذا المستودع للحصول على آخر التحديثات!
Stay tuned for updates!

---

**تحت التطوير / Under Development** 🚧
