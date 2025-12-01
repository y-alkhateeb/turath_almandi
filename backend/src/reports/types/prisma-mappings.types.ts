// ============================================
// PRISMA TYPE MAPPINGS FOR DYNAMIC QUERIES
// ============================================

import { Prisma } from '@prisma/client';
import { DataSourceType } from './report.types';

// ============================================
// WHERE INPUT TYPES
// ============================================

/**
 * Map data source to Prisma WhereInput type
 */
export type PrismaWhereInputMap = {
  transactions: Prisma.TransactionWhereInput;
  payables: Prisma.AccountPayableWhereInput;
  receivables: Prisma.AccountReceivableWhereInput;
  inventory: Prisma.InventoryItemWhereInput;
  salaries: Prisma.EmployeeWhereInput;
  branches: Prisma.BranchWhereInput;
};

/**
 * Get WhereInput type for a data source
 */
export type WhereInputForDataSource<T extends DataSourceType> = PrismaWhereInputMap[T];

// ============================================
// SELECT INPUT TYPES
// ============================================

export type PrismaSelectInputMap = {
  transactions: Prisma.TransactionSelect;
  payables: Prisma.AccountPayableSelect;
  receivables: Prisma.AccountReceivableSelect;
  inventory: Prisma.InventoryItemSelect;
  salaries: Prisma.EmployeeSelect;
  branches: Prisma.BranchSelect;
};

export type SelectInputForDataSource<T extends DataSourceType> = PrismaSelectInputMap[T];

// ============================================
// ORDER BY INPUT TYPES
// ============================================

export type PrismaOrderByInputMap = {
  transactions: Prisma.TransactionOrderByWithRelationInput;
  payables: Prisma.AccountPayableOrderByWithRelationInput;
  receivables: Prisma.AccountReceivableOrderByWithRelationInput;
  inventory: Prisma.InventoryItemOrderByWithRelationInput;
  salaries: Prisma.EmployeeOrderByWithRelationInput;
  branches: Prisma.BranchOrderByWithRelationInput;
};

export type OrderByInputForDataSource<T extends DataSourceType> = PrismaOrderByInputMap[T];

// ============================================
// PAYLOAD TYPES
// ============================================

export type PrismaPayloadMap = {
  transactions: Prisma.TransactionGetPayload<object>;
  payables: Prisma.AccountPayableGetPayload<object>;
  receivables: Prisma.AccountReceivableGetPayload<object>;
  inventory: Prisma.InventoryItemGetPayload<object>;
  salaries: Prisma.EmployeeGetPayload<object>;
  branches: Prisma.BranchGetPayload<object>;
};

export type PayloadForDataSource<T extends DataSourceType> = PrismaPayloadMap[T];

// ============================================
// FIELD NAMES BY DATA SOURCE
// ============================================

/**
 * Valid field names for each data source
 */
export type TransactionFields = keyof Prisma.TransactionScalarFieldEnum;
export type PayableFields = keyof Prisma.AccountPayableScalarFieldEnum;
export type ReceivableFields = keyof Prisma.AccountReceivableScalarFieldEnum;
export type InventoryFields = keyof Prisma.InventoryItemScalarFieldEnum;
export type EmployeeFields = keyof Prisma.EmployeeScalarFieldEnum;
export type BranchFields = keyof Prisma.BranchScalarFieldEnum;

export type FieldsForDataSource<T extends DataSourceType> =
  T extends 'transactions' ? TransactionFields :
  T extends 'payables' ? PayableFields :
  T extends 'receivables' ? ReceivableFields :
  T extends 'inventory' ? InventoryFields :
  T extends 'salaries' ? EmployeeFields :
  T extends 'branches' ? BranchFields :
  never;

// ============================================
// PRISMA DELEGATE MAP
// ============================================

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Get Prisma delegate for data source
 */
export function getPrismaDelegate(prisma: PrismaService, dataSource: DataSourceType) {
  const delegateMap = {
    transactions: prisma.transaction,
    payables: prisma.accountPayable,
    receivables: prisma.accountReceivable,
    inventory: prisma.inventoryItem,
    salaries: prisma.employee,
    branches: prisma.branch,
  } as const;

  return delegateMap[dataSource];
}
