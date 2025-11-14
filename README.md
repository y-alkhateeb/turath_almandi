# تراث المندي - نظام المحاسبة للمطاعم
## Turath Al-Mandi Restaurant Accounting System

نظام محاسبة متكامل للمطاعم مبني بتقنيات حديثة مع دعم كامل للغة العربية.
A comprehensive restaurant accounting system built with modern technologies and full Arabic language support.

---

## 📁 هيكل المشروع / Project Structure

```
turath_almandi/
├── frontend/          # واجهة المستخدم / Frontend Application
│   ├── src/          # React + TypeScript + Vite
│   ├── package.json
│   └── README.md     # Frontend documentation
│
├── backend/           # الخادم / Backend Application
│   ├── src/          # NestJS + TypeScript + Prisma
│   ├── prisma/       # Database schema
│   ├── package.json
│   └── README.md     # Backend documentation
│
└── README.md         # هذا الملف / This file
```

---

## 🏗️ البنية التقنية / Tech Stack

### Frontend (واجهة المستخدم)
- **React 19.2** - مكتبة واجهة المستخدم / UI Library
- **Vite 7.2** - أداة البناء / Build Tool
- **TypeScript 5.9.3** - لغة البرمجة / Programming Language
- **TailwindCSS 4.1.17** - إطار التصميم مع RTL / CSS Framework with RTL
- **React Router 7.9.6** - التنقل / Routing
- **Zustand 5.0.8** - إدارة الحالة / State Management
- **TanStack Query 5.90.9** - إدارة حالة الخادم / Server State
- **Axios** - طلبات HTTP / HTTP Requests

### Backend (الخادم)
- **NestJS 11.1.9** - إطار عمل Node.js / Node.js Framework
- **TypeScript 5.9.3** - لغة البرمجة / Programming Language
- **PostgreSQL 18** - قاعدة البيانات / Database
- **Prisma 6.19.0** - ORM حديث / Modern ORM
- **JWT** - المصادقة والتفويض / Authentication & Authorization
- **Bcrypt** - تشفير كلمات المرور / Password Hashing
- **Passport** - وسيط المصادقة / Authentication Middleware

---

## 🚀 البدء السريع / Quick Start

### المتطلبات / Prerequisites
- Node.js 18+
- PostgreSQL 18 (or Docker)
- npm or yarn

### تثبيت Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend will run on: `http://localhost:3000`

### تثبيت Backend

```bash
cd backend

# Using Docker (Recommended)
docker-compose up -d postgres

# Install dependencies
npm install
cp .env.example .env

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run start:dev
```

Backend API will run on: `http://localhost:3000/api/v1`

---

## 📋 الميزات / Features

### ✅ المكتمل / Completed

#### Frontend
- ✅ واجهة عربية كاملة مع دعم RTL / Full Arabic UI with RTL support
- ✅ نظام المصادقة / Authentication system
- ✅ لوحة التحكم الرئيسية / Main dashboard
- ✅ إدارة الجلسات / Session management
- ✅ تصميم متجاوب / Responsive design
- ✅ مسارات محمية / Protected routes

#### Backend
- ✅ مصادقة JWT / JWT authentication
- ✅ التحكم بالصلاحيات (RBAC) / Role-based access control
- ✅ إدارة المستخدمين / User management
- ✅ تشفير كلمات المرور / Password hashing
- ✅ التحقق من البيانات / Data validation
- ✅ إعدادات CORS / CORS configuration

### 🔄 قيد التطوير / In Progress
- 🔄 نظام المبيعات / Sales management
- 🔄 نظام المشتريات / Purchases management
- 🔄 إدارة المخزون / Inventory management
- 🔄 إدارة القوائم / Menu management
- 🔄 معالجة الطلبات / Order processing
- 🔄 التقارير والإحصائيات / Reports & Analytics

### 📝 مخطط / Planned
- 📝 طباعة الفواتير / Invoice printing
- 📝 إدارة الموظفين / Employee management
- 📝 نظام الحسابات المالية / Financial accounting
- 📝 تطبيق الموبايل / Mobile app
- 📝 لوحة تحكم متقدمة / Advanced analytics

---

## 📖 التوثيق / Documentation

- [Frontend Documentation](./frontend/README.md) - توثيق واجهة المستخدم
- [Backend Documentation](./backend/README.md) - توثيق الخادم
- [Backend Quick Setup](./backend/SETUP.md) - دليل الإعداد السريع للخادم

---

## 🔧 البيئة التطويرية / Development Environment

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Backend Environment Variables
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/turath_almandi"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
```

---

## 🏛️ الهيكل المعماري / Architecture

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  - UI Components                        │
│  - State Management (Zustand)           │
│  - API Client (Axios + TanStack Query)  │
│  - RTL Arabic Interface                 │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST API
                  │ JWT Authentication
                  │
┌─────────────────▼───────────────────────┐
│        Backend (NestJS)                 │
│  - REST API Endpoints                   │
│  - Business Logic                       │
│  - Authentication & Authorization       │
│  - Data Validation                      │
└─────────────────┬───────────────────────┘
                  │
                  │ Prisma ORM
                  │
┌─────────────────▼───────────────────────┐
│       Database (PostgreSQL 18)          │
│  - Users & Roles                        │
│  - Menu & Orders                        │
│  - Transactions & Inventory             │
└─────────────────────────────────────────┘
```

---

## 🎯 الأدوار والصلاحيات / User Roles

- **ADMIN** (مدير النظام) - Full system access
- **MANAGER** (مدير المطعم) - Management operations
- **ACCOUNTANT** (المحاسب) - Financial operations
- **CASHIER** (أمين الصندوق) - Payment processing
- **WAITER** (النادل) - Order management

---

## 🤝 المساهمة / Contributing

هذا المشروع قيد التطوير النشط. للمساهمة:
This project is under active development. To contribute:

1. Fork المشروع / Fork the project
2. أنشئ فرع للميزة / Create a feature branch
3. Commit التغييرات / Commit your changes
4. Push إلى الفرع / Push to the branch
5. افتح Pull Request / Open a Pull Request

---

## 🗺️ خارطة الطريق / Roadmap

### المرحلة 1: الأساسيات ✅ Phase 1: Foundation
- [x] إعداد Frontend / Frontend setup
- [x] إعداد Backend / Backend setup
- [x] نظام المصادقة / Authentication system
- [x] لوحة التحكم الأساسية / Basic dashboard

### المرحلة 2: الوظائف الأساسية 🔄 Phase 2: Core Features
- [ ] API للمبيعات / Sales API
- [ ] API للمشتريات / Purchases API
- [ ] API للمخزون / Inventory API
- [ ] API للقوائم / Menu API
- [ ] معالجة الطلبات / Order processing

### المرحلة 3: الميزات المتقدمة 📝 Phase 3: Advanced Features
- [ ] التقارير المالية / Financial reports
- [ ] إدارة الموظفين / Employee management
- [ ] طباعة الفواتير / Invoice printing
- [ ] النسخ الاحتياطي / Backup system

### المرحلة 4: التحسينات 📝 Phase 4: Enhancements
- [ ] تطبيق الموبايل / Mobile app
- [ ] التكامل مع أنظمة خارجية / External integrations
- [ ] لوحات تحكم متقدمة / Advanced analytics
- [ ] إشعارات فورية / Real-time notifications

---

## 🐛 استكشاف الأخطاء / Troubleshooting

### Frontend Issues
- Check that backend is running on correct port
- Verify `VITE_API_URL` in `.env`
- Clear browser cache and restart dev server

### Backend Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Regenerate Prisma client: `npm run prisma:generate`
- See [Backend SETUP.md](./backend/SETUP.md) for more details

---

## 📄 الترخيص / License

جميع الحقوق محفوظة © 2025 تراث المندي
All rights reserved © 2025 Turath Al-Mandi

UNLICENSED - Private Project

---

## 📧 التواصل / Contact

للاستفسارات والدعم / For inquiries and support:
- Project: Turath Al-Mandi Restaurant Accounting System
- Built with ❤️ in Saudi Arabia

---

**مبني بـ ❤️ في السعودية / Built with ❤️ in Saudi Arabia**
