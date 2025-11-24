import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIELD_METADATA = [
  // Transactions
  { dataSource: 'transactions', fieldName: 'id', displayName: 'المعرف', dataType: 'string', filterable: false, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 999 },
  { dataSource: 'transactions', fieldName: 'amount', displayName: 'المبلغ', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 1, format: 'currency' },
  { dataSource: 'transactions', fieldName: 'type', displayName: 'النوع', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 2, enumValues: ['INCOME', 'EXPENSE'] },
  { dataSource: 'transactions', fieldName: 'category', displayName: 'الفئة', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 3 },
  { dataSource: 'transactions', fieldName: 'paymentMethod', displayName: 'طريقة الدفع', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 4, enumValues: ['CASH', 'MASTER'] },
  { dataSource: 'transactions', fieldName: 'employeeVendorName', displayName: 'اسم الموظف/المورد', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 5 },
  { dataSource: 'transactions', fieldName: 'notes', displayName: 'الملاحظات', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 6 },
  { dataSource: 'transactions', fieldName: 'date', displayName: 'التاريخ', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 7, format: 'date-short' },
  { dataSource: 'transactions', fieldName: 'createdAt', displayName: 'تاريخ الإنشاء', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 10, format: 'date-long' },

  // Debts
  { dataSource: 'debts', fieldName: 'id', displayName: 'المعرف', dataType: 'string', filterable: false, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 999 },
  { dataSource: 'debts', fieldName: 'creditorName', displayName: 'اسم الدائن', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 1 },
  { dataSource: 'debts', fieldName: 'originalAmount', displayName: 'المبلغ الأصلي', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 2, format: 'currency' },
  { dataSource: 'debts', fieldName: 'remainingAmount', displayName: 'المبلغ المتبقي', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 3, format: 'currency' },
  { dataSource: 'debts', fieldName: 'status', displayName: 'الحالة', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 4, enumValues: ['ACTIVE', 'PAID', 'PARTIAL'] },
  { dataSource: 'debts', fieldName: 'date', displayName: 'تاريخ الدين', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 5, format: 'date-short' },
  { dataSource: 'debts', fieldName: 'dueDate', displayName: 'تاريخ الاستحقاق', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 6, format: 'date-short' },
  { dataSource: 'debts', fieldName: 'notes', displayName: 'الملاحظات', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 7 },

  // Inventory
  { dataSource: 'inventory', fieldName: 'id', displayName: 'المعرف', dataType: 'string', filterable: false, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 999 },
  { dataSource: 'inventory', fieldName: 'name', displayName: 'اسم الصنف', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 1 },
  { dataSource: 'inventory', fieldName: 'quantity', displayName: 'الكمية', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 2 },
  { dataSource: 'inventory', fieldName: 'unit', displayName: 'الوحدة', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 3, enumValues: ['KG', 'PIECE', 'LITER', 'OTHER'] },
  { dataSource: 'inventory', fieldName: 'costPerUnit', displayName: 'التكلفة لكل وحدة', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 4, format: 'currency' },
  { dataSource: 'inventory', fieldName: 'lastUpdated', displayName: 'آخر تحديث', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 5, format: 'date-long' },

  // Employees (for salaries)
  { dataSource: 'salaries', fieldName: 'id', displayName: 'المعرف', dataType: 'string', filterable: false, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 999 },
  { dataSource: 'salaries', fieldName: 'name', displayName: 'اسم الموظف', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 1 },
  { dataSource: 'salaries', fieldName: 'position', displayName: 'المنصب', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 2 },
  { dataSource: 'salaries', fieldName: 'baseSalary', displayName: 'الراتب الأساسي', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 3, format: 'currency' },
  { dataSource: 'salaries', fieldName: 'allowance', displayName: 'البدل', dataType: 'number', filterable: true, sortable: true, aggregatable: true, groupable: false, defaultVisible: true, defaultOrder: 4, format: 'currency' },
  { dataSource: 'salaries', fieldName: 'status', displayName: 'الحالة', dataType: 'enum', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 5, enumValues: ['ACTIVE', 'RESIGNED'] },
  { dataSource: 'salaries', fieldName: 'hireDate', displayName: 'تاريخ التوظيف', dataType: 'date', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 6, format: 'date-short' },

  // Branches
  { dataSource: 'branches', fieldName: 'id', displayName: 'المعرف', dataType: 'string', filterable: false, sortable: false, aggregatable: false, groupable: false, defaultVisible: false, defaultOrder: 999 },
  { dataSource: 'branches', fieldName: 'name', displayName: 'اسم الفرع', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 1 },
  { dataSource: 'branches', fieldName: 'location', displayName: 'الموقع', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 2 },
  { dataSource: 'branches', fieldName: 'managerName', displayName: 'اسم المدير', dataType: 'string', filterable: true, sortable: true, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 3 },
  { dataSource: 'branches', fieldName: 'phone', displayName: 'الهاتف', dataType: 'string', filterable: true, sortable: false, aggregatable: false, groupable: false, defaultVisible: true, defaultOrder: 4 },
  { dataSource: 'branches', fieldName: 'isActive', displayName: 'نشط', dataType: 'boolean', filterable: true, sortable: true, aggregatable: false, groupable: true, defaultVisible: true, defaultOrder: 5 },
];

async function seed() {
  console.log('Seeding report field metadata...');

  for (const field of FIELD_METADATA) {
    await prisma.reportFieldMetadata.upsert({
      where: {
        dataSource_fieldName: {
          dataSource: field.dataSource,
          fieldName: field.fieldName,
        },
      },
      update: field,
      create: field,
    });
  }

  console.log(`Seeded ${FIELD_METADATA.length} field metadata records`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

export default seed;
