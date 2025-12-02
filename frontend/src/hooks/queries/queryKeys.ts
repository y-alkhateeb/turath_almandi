export const queryKeys = {
  dashboard: {
    stats: 'dashboard-stats',
    summary: 'dashboard-summary',
  },
  transactions: {
    all: 'transactions',
    list: (filters: any) => ['transactions', 'list', filters],
    detail: (id: string) => ['transactions', 'detail', id],
    summary: 'transactions-summary',
  },
  employees: {
    all: 'employees',
    list: (filters: any) => ['employees', 'list', filters],
    detail: (id: string) => ['employees', 'detail', id],
    salaryDetails: (id: string, month: string) => ['employees', 'salary', id, month],
    active: 'employees-active',
  },
  payables: {
    all: 'payables',
    list: (filters: any) => ['payables', 'list', filters],
    detail: (id: string) => ['payables', 'detail', id],
  },
  receivables: {
    all: 'receivables',
    list: (filters: any) => ['receivables', 'list', filters],
    detail: (id: string) => ['receivables', 'detail', id],
  },
  inventory: {
    all: 'inventory',
    list: (filters: any) => ['inventory', 'list', filters],
    items: 'inventory-items',
  },
  contacts: {
    all: ['contacts', 'all'],
    list: (filters: any) => ['contacts', 'list', filters],
    detail: (id: string) => ['contacts', 'detail', id],
    summary: (branchId?: string) => ['contacts', 'summary', branchId],
    suppliers: ['contacts', 'suppliers'],
    customers: ['contacts', 'customers'],
  },
  settings: {
    currency: 'settings-currency',
    app: 'settings-app',
  },
  discountReasons: {
    all: 'discount-reasons',
    detail: (id: string) => ['discount-reasons', 'detail', id],
  },
  notifications: {
    all: 'notifications',
    unread: 'notifications-unread',
  },
  auth: {
    profile: ['auth', 'profile'],
  },
  branches: {
    all: ['branches', 'all'],
    list: (filters: any) => ['branches', 'list', filters],
    detail: (id: string) => ['branches', 'detail', id],
  },
};
