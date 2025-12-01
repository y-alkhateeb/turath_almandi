/**
 * ContactList - Presentational Component
 * Table displaying contacts (suppliers and customers) with type badges
 *
 * Features:
 * - Table with name, type, phone, email, credit limit, branch, actions
 * - Type badge with color coding (supplier=blue, customer=green)
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Phone, Mail, User } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { CurrencyAmountCompact } from '@/components/currency';
import { ContactType } from '@/types/enum';
import type { Contact } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get type badge styling
 */
const getTypeBadge = (type: ContactType): React.ReactNode => {
  const badgeClasses: Record<ContactType, string> = {
    [ContactType.SUPPLIER]: 'bg-blue-100 text-blue-800 border-blue-300',
    [ContactType.CUSTOMER]: 'bg-green-100 text-green-800 border-green-300',
  };

  const badgeLabels: Record<ContactType, string> = {
    [ContactType.SUPPLIER]: 'مورد',
    [ContactType.CUSTOMER]: 'عميل',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[type]}`}
    >
      {badgeLabels[type]}
    </span>
  );
};

// ============================================
// COMPONENT
// ============================================

export function ContactList({ contacts, isLoading, onEdit, onView }: ContactListProps) {
  // Define table columns
  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'الاسم',
      width: '200px',
      render: (contact) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="font-medium text-[var(--text-primary)]">{contact.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'النوع',
      width: '100px',
      align: 'center',
      render: (contact) => getTypeBadge(contact.type),
    },
    {
      key: 'phone',
      header: 'رقم الهاتف',
      width: '150px',
      render: (contact) => (
        <div className="flex items-center gap-1 text-sm">
          <Phone className="w-4 h-4 text-[var(--text-secondary)]" />
          {contact.phone}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'البريد الإلكتروني',
      width: '200px',
      render: (contact) => {
        if (!contact.email) return '-';
        return (
          <div className="flex items-center gap-1 text-sm">
            <Mail className="w-4 h-4 text-[var(--text-secondary)]" />
            {contact.email}
          </div>
        );
      },
    },
    {
      key: 'creditLimit',
      header: 'حد الائتمان',
      width: '140px',
      align: 'right',
      render: (contact) => {
        if (!contact.creditLimit) return '-';
        return (
          <span className="font-semibold">
            <CurrencyAmountCompact amount={contact.creditLimit} />
          </span>
        );
      },
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '120px',
      render: (contact) => contact.branch?.name || '-',
    },
  ];

  // Add actions column if handlers provided
  if (onEdit || onView) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '150px',
      align: 'center',
      render: (contact) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(contact.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="عرض التفاصيل"
            >
              عرض
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contact.id);
              }}
              className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors font-semibold"
              title="تعديل"
            >
              تعديل
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <Table<Contact>
        data={contacts}
        columns={columns}
        keyExtractor={(contact) => contact.id}
        isLoading={isLoading}
        emptyMessage="لا توجد جهات اتصال"
        striped
        hoverable
      />
    </div>
  );
}

export default ContactList;
