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
│   └── README.md     # Frontend documentation
│
├── backend/           # الخادم / Backend Application
│   └── README.md     # Backend documentation (Coming soon)
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

### Backend (الخادم) - قريباً / Coming Soon
- To be implemented

---

## 🚀 البدء السريع / Quick Start

### المتطلبات / Prerequisites
- Node.js 18+
- npm أو yarn / npm or yarn

### التثبيت / Installation

#### 1. استنساخ المشروع / Clone the repository
```bash
git clone <repository-url>
cd turath_almandi
```

#### 2. تثبيت Frontend
```bash
cd frontend
npm install
cp .env.example .env
```

#### 3. تشغيل Frontend في وضع التطوير / Run Frontend Development Server
```bash
cd frontend
npm run dev
```
سيعمل التطبيق على / Application will run on: `http://localhost:3000`

---

## 📋 الميزات / Features

### ✅ المكتمل / Completed
- ✅ واجهة عربية كاملة مع دعم RTL / Full Arabic UI with RTL support
- ✅ نظام المصادقة والحماية / Authentication & Authorization
- ✅ لوحة التحكم الرئيسية / Main Dashboard
- ✅ إدارة الجلسات / Session Management
- ✅ تصميم متجاوب / Responsive Design

### 🔄 قيد التطوير / In Progress
- 🔄 نظام المبيعات / Sales Management
- 🔄 نظام المشتريات / Purchases Management
- 🔄 إدارة المخزون / Inventory Management
- 🔄 التقارير والإحصائيات / Reports & Analytics
- 🔄 إدارة الموظفين / Employee Management

### 📝 مخطط / Planned
- 📝 Backend API
- 📝 قاعدة البيانات / Database
- 📝 طباعة الفواتير / Invoice Printing
- 📝 تطبيق الموبايل / Mobile App

---

## 📖 التوثيق / Documentation

- [Frontend Documentation](./frontend/README.md) - توثيق واجهة المستخدم
- [Backend Documentation](./backend/README.md) - توثيق الخادم (قريباً / Coming Soon)

---

## 🔧 البيئة التطويرية / Development Environment

### متغيرات البيئة / Environment Variables

#### Frontend
انسخ `.env.example` إلى `.env` في مجلد frontend وقم بتعديل القيم:
Copy `.env.example` to `.env` in frontend folder and modify values:

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🏛️ الهيكل المعماري / Architecture

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  - UI Components                        │
│  - State Management (Zustand)           │
│  - API Client (Axios + TanStack Query)  │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST API
                  │
┌─────────────────▼───────────────────────┐
│          Backend (Coming Soon)          │
│  - REST API                             │
│  - Business Logic                       │
│  - Authentication                       │
└─────────────────┬───────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────┐
│         Database (Coming Soon)          │
│  - PostgreSQL / MySQL                   │
│  - Data Persistence                     │
└─────────────────────────────────────────┘
```

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

## 📄 الترخيص / License

جميع الحقوق محفوظة © 2025 تراث المندي
All rights reserved © 2025 Turath Al-Mandi

---

## 📧 التواصل / Contact

للاستفسارات والدعم / For inquiries and support:
- Email: info@turathmandi.com
- Website: www.turathmandi.com

---

## 🗺️ خارطة الطريق / Roadmap

### المرحلة 1: الأساسيات ✅
- [x] إعداد Frontend
- [x] نظام المصادقة
- [x] لوحة التحكم الأساسية

### المرحلة 2: الوظائف الأساسية 🔄
- [ ] إعداد Backend
- [ ] قاعدة البيانات
- [ ] API للمبيعات
- [ ] API للمشتريات
- [ ] API للمخزون

### المرحلة 3: الميزات المتقدمة 📝
- [ ] التقارير المالية
- [ ] إدارة الموظفين
- [ ] نظام الصلاحيات
- [ ] طباعة الفواتير

### المرحلة 4: التحسينات 📝
- [ ] تطبيق الموبايل
- [ ] النسخ الاحتياطي التلقائي
- [ ] التكامل مع أنظمة خارجية
- [ ] لوحات تحكم متقدمة

---

**مبني بـ ❤️ في السعودية / Built with ❤️ in Saudi Arabia**
