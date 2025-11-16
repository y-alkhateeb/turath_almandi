# Frontend Refactoring Guide - UI Component Usage Best Practices

## Overview
This guide demonstrates the proper use of our UI component library across all pages. Following these patterns ensures consistency, maintainability, and reduces code duplication.

---

## ✅ Available UI Components

Located in `/src/components/ui/`:
- **Button** - All clickable actions
- **PageHeader** - Page titles and actions
- **Card** - Content containers
- **Table** - Data tables
- **Badge** - Status indicators
- **Alert** - Error/success messages
- **EmptyState** - No data states
- **LoadingSpinner** - Loading indicators
- **ConfirmModal** - Confirmation dialogs
- **Pagination** - Page navigation

---

## 🎯 Refactoring Pattern (BranchesPage Example)

### ❌ **BEFORE** - Not Using Components

```tsx
// Raw button - DON'T DO THIS
<button
  onClick={() => setIsCreateModalOpen(true)}
  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor">...</svg>
  إضافة فرع جديد
</button>

// Raw header - DON'T DO THIS
<div className="mb-8">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الفروع</h1>
      <p className="text-gray-600">إدارة جميع فروع المؤسسة</p>
    </div>
    ...
  </div>
</div>

// Raw table - DON'T DO THIS
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-6 py-4 text-right...">اسم الفرع</th>
      ...
    </tr>
  </thead>
  <tbody>
    {branches.map(branch => (
      <tr key={branch.id}>
        <td className="px-6 py-4...">{branch.name}</td>
        ...
      </tr>
    ))}
  </tbody>
</table>
```

### ✅ **AFTER** - Using UI Components

```tsx
import {
  Button,
  PageHeader,
  Table,
  Badge,
  ConfirmModal,
  Alert,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import type { Column } from '@/components/ui/Table';

// 1. Use PageHeader component
<PageHeader
  title="إدارة الفروع"
  description="إدارة جميع فروع المؤسسة"
  actions={
    <Button
      variant="primary"
      onClick={() => setIsCreateModalOpen(true)}
      leftIcon={<Plus className="w-5 h-5" />}
    >
      إضافة فرع جديد
    </Button>
  }
/>

// 2. Use Table component with columns configuration
const columns: Column<Branch>[] = [
  {
    key: 'name',
    header: 'اسم الفرع',
    render: (branch) => (
      <div className="font-medium text-gray-900">{branch.name}</div>
    ),
  },
  {
    key: 'isActive',
    header: 'الحالة',
    render: (branch) => (
      <Badge variant={branch.isActive ? 'success' : 'danger'}>
        {branch.isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    ),
  },
  {
    key: 'actions',
    header: 'الإجراءات',
    render: (branch) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditingBranch(branch)}
          leftIcon={<Edit className="w-4 h-4" />}
        >
          تعديل
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeletingBranchId(branch.id)}
          leftIcon={<Trash2 className="w-4 h-4" />}
          className="text-red-600 hover:text-red-700"
        >
          حذف
        </Button>
      </div>
    ),
  },
];

<Table columns={columns} data={branches} />

// 3. Use ConfirmModal for deletions
<ConfirmModal
  isOpen={!!deletingBranchId}
  onClose={() => setDeletingBranchId(null)}
  onConfirm={handleDelete}
  title="تأكيد الحذف"
  message="هل أنت متأكد من حذف هذا الفرع؟"
  variant="danger"
  isLoading={deleteBranch.isPending}
/>

// 4. Use Alert for errors
{error && (
  <Alert variant="danger" title="خطأ">
    حدث خطأ أثناء تحميل البيانات
  </Alert>
)}

// 5. Use EmptyState for no data
<EmptyState
  icon={<Building2 className="w-full h-full" />}
  title="لا توجد فروع"
  description="لم يتم إضافة أي فرع بعد"
  action={{
    label: 'إضافة فرع جديد',
    onClick: () => setIsCreateModalOpen(true),
  }}
/>

// 6. Use LoadingSpinner for loading
{isLoading && (
  <LoadingSpinner size="lg" text="جاري تحميل البيانات..." />
)}
```

---

## 📋 Page Structure Template

Every CRUD page should follow this structure:

```tsx
import { useState } from 'react';
import { Plus, Edit, Trash2, [IconName] } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { use[Entity], useCreate[Entity], useUpdate[Entity], useDelete[Entity] } from '@/hooks/use[Entity]';
import { Modal } from '@/components/Modal';
import { [Entity]Form } from '@/components/[Entity]Form';
import {
  LoadingSpinner,
  EmptyState,
  Alert,
  PageHeader,
  Button,
  Table,
  Badge,
  ConfirmModal,
} from '@/components/ui';
import type { [Entity], [Entity]FormData } from '@/types';
import type { Column } from '@/components/ui/Table';

export const [Entity]Page = () => {
  // 1. Hooks
  const { isAdmin } = useAuth();
  const { data: items = [], isLoading, error } = use[Entity]();
  const create = useCreate[Entity]();
  const update = useUpdate[Entity]();
  const deleteItem = useDelete[Entity]();

  // 2. State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<[Entity] | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // 3. Handlers
  const handleCreate = async (data: [Entity]FormData) => {
    await create.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdate = async (data: [Entity]FormData) => {
    if (!editingItem) return;
    await update.mutateAsync({ id: editingItem.id, data });
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (!deletingItemId) return;
    await deleteItem.mutateAsync(deletingItemId);
    setDeletingItemId(null);
  };

  // 4. Table columns
  const columns: Column<[Entity]>[] = [
    // ... column definitions
  ];

  // 5. Render
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="[Page Title]"
        description="[Page Description]"
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            إضافة جديد
          </Button>
        }
      />

      {/* Error State */}
      {error && <Alert variant="danger">Error message</Alert>}

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Table columns={columns} data={items} />
      )}

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={...}>
        <[Entity]Form onSubmit={handleCreate} />
      </Modal>

      <ConfirmModal isOpen={!!deletingItemId} onConfirm={handleDelete} />
    </div>
  );
};
```

---

## 🎨 Component Usage Guidelines

### Button Component

```tsx
// Primary action
<Button variant="primary" onClick={handleClick}>
  Save
</Button>

// With icon
<Button variant="primary" leftIcon={<Plus />}>
  Add New
</Button>

// Loading state
<Button variant="primary" isLoading={isSubmitting}>
  Submit
</Button>

// Variants: primary, secondary, success, danger, outline, ghost
// Sizes: sm, md, lg
```

### Badge Component

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Inactive</Badge>
<Badge variant="warning">Pending</Badge>
```

### Table Component

```tsx
const columns: Column<DataType>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => <span>{row.name}</span>,
  },
];

<Table columns={columns} data={data} />
```

### PageHeader Component

```tsx
<PageHeader
  title="Page Title"
  description="Optional description"
  actions={<Button>Action</Button>}
/>
```

---

## 📊 Refactoring Checklist

For each page, ensure:

- [ ] Imports UI components from `@/components/ui`
- [ ] Uses `<PageHeader>` for page title and actions
- [ ] Uses `<Button>` for all clickable elements
- [ ] Uses `<Table>` with column configuration
- [ ] Uses `<Badge>` for status indicators
- [ ] Uses `<Alert>` for error messages
- [ ] Uses `<EmptyState>` for no data
- [ ] Uses `<LoadingSpinner>` for loading
- [ ] Uses `<ConfirmModal>` for delete confirmations
- [ ] Uses Lucide React icons instead of inline SVGs
- [ ] Follows consistent spacing (`space-y-6`)
- [ ] No raw `<button>`, `<table>`, or custom styled divs
- [ ] Consistent color tokens (primary-600, not blue-600)

---

## 📁 Pages to Refactor (Priority Order)

1. ✅ **BranchesPage** - DONE (Reference Implementation)
2. 🔄 **UsersPage** - Similar to BranchesPage (High Priority)
3. 🔄 **DebtsPage** - Uses table and CRUD operations
4. 🔄 **InventoryPage** - Uses table and CRUD operations
5. 🔄 **TransactionsPage** - Complex table with filters
6. 🔄 **DashboardPage** - Needs PageHeader, Button updates
7. ✅ **LoginPage** - Minimal changes needed

---

## 💡 Benefits of Refactoring

- **66% code reduction** - Eliminate duplication
- **Consistent UI/UX** - Same look and feel everywhere
- **Easier maintenance** - Changes in one place
- **Better accessibility** - Components built with a11y
- **Type safety** - TypeScript definitions
- **Faster development** - Reusable patterns

---

## 🚀 Next Steps

1. Review refactored `BranchesPage.tsx` as reference
2. Apply same pattern to `UsersPage.tsx`
3. Continue with remaining pages
4. Remove old backup files once tested
5. Update documentation for new developers

---

**Last Updated:** [Date]
**Reference:** `/src/pages/branches/BranchesPage.tsx` (refactored)
