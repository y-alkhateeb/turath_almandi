import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { TransactionType, DebtStatus, UserRole, Prisma } from '@prisma/client';
import { applyBranchFilter } from '../common/utils/query-builder';
import { formatToISODate } from '../common/utils/date.utils';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

interface ExportFilters {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ExcelExportService {
  private readonly logger = new Logger(ExcelExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export transactions to Excel format
   * @param user - Current user for access control
   * @param filters - Optional filters for transactions
   * @returns Excel file as Buffer
   */
  async exportTransactions(user: RequestUser, filters: ExportFilters = {}): Promise<Buffer> {
    this.logger.log('Exporting transactions to Excel');

    // Build where clause with filters and user role
    let where: Prisma.TransactionWhereInput = {};
    where = applyBranchFilter(user, where, filters.branchId);

    // Apply date filters
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = new Date(filters.endDate);
      }
    }

    // Fetch transactions from database
    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        branch: {
          select: { name: true, location: true },
        },
        creator: {
          select: { username: true },
        },
        inventoryItem: {
          select: { name: true, unit: true },
        },
      },
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Employee/Vendor', key: 'employeeVendorName', width: 20 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Inventory Item', key: 'inventoryItem', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data rows
    transactions.forEach((transaction) => {
      worksheet.addRow({
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        date: formatToISODate(transaction.date),
        paymentMethod: transaction.paymentMethod || 'N/A',
        employeeVendorName: transaction.employeeVendorName || 'N/A',
        branch: transaction.branch?.name || 'N/A',
        inventoryItem: transaction.inventoryItem?.name || 'N/A',
        createdBy: transaction.creator?.username || 'N/A',
        notes: transaction.notes || '',
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.width || 10, column.header.length + 2);
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    this.logger.log(`Exported ${transactions.length} transactions to Excel`);
    return buffer as Buffer;
  }

  /**
   * Export debts to Excel format
   * @param user - Current user for access control
   * @param filters - Optional filters for debts
   * @returns Excel file as Buffer
   */
  async exportDebts(user: RequestUser, filters: ExportFilters = {}): Promise<Buffer> {
    this.logger.log('Exporting debts to Excel');

    // Build where clause with filters and user role
    let where: Prisma.DebtWhereInput = {};
    where = applyBranchFilter(user, where, filters.branchId);

    // Apply date filters on dueDate
    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.dueDate.lte = new Date(filters.endDate);
      }
    }

    // Fetch debts from database
    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        branch: {
          select: { name: true, location: true },
        },
        creator: {
          select: { username: true },
        },
        payments: {
          select: {
            amountPaid: true,
            paymentDate: true,
          },
        },
      },
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Debts');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Creditor Name', key: 'creditorName', width: 20 },
      { header: 'Original Amount', key: 'originalAmount', width: 15 },
      { header: 'Remaining Amount', key: 'remainingAmount', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Due Date', key: 'dueDate', width: 12 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 15 },
      { header: 'Total Payments', key: 'totalPayments', width: 15 },
      { header: 'Payment Count', key: 'paymentCount', width: 12 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data rows
    debts.forEach((debt) => {
      const totalPayments = debt.payments.reduce(
        (sum, payment) => sum + Number(payment.amountPaid),
        0,
      );

      worksheet.addRow({
        id: debt.id,
        creditorName: debt.creditorName,
        originalAmount: Number(debt.originalAmount),
        remainingAmount: Number(debt.remainingAmount),
        status: debt.status,
        date: formatToISODate(debt.date),
        dueDate: formatToISODate(debt.dueDate),
        branch: debt.branch?.name || 'N/A',
        createdBy: debt.creator?.username || 'N/A',
        totalPayments: totalPayments,
        paymentCount: debt.payments.length,
        notes: debt.notes || '',
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.width || 10, column.header.length + 2);
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    this.logger.log(`Exported ${debts.length} debts to Excel`);
    return buffer as Buffer;
  }

  /**
   * Export inventory to Excel format
   * @param user - Current user for access control
   * @param filters - Optional filters for inventory
   * @returns Excel file as Buffer
   */
  async exportInventory(user: RequestUser, filters: ExportFilters = {}): Promise<Buffer> {
    this.logger.log('Exporting inventory to Excel');

    // Build where clause with filters and user role
    let where: Prisma.InventoryItemWhereInput = {};
    where = applyBranchFilter(user, where, filters.branchId);

    // Fetch inventory items from database
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        branch: {
          select: { name: true, location: true },
        },
        transactions: {
          select: {
            type: true,
            amount: true,
            category: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 1, // Get most recent transaction
        },
      },
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit', key: 'unit', width: 12 },
      { header: 'Cost Per Unit', key: 'costPerUnit', width: 15 },
      { header: 'Total Value', key: 'totalValue', width: 15 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Last Updated', key: 'lastUpdated', width: 12 },
      { header: 'Last Transaction', key: 'lastTransaction', width: 15 },
      { header: 'Last Transaction Date', key: 'lastTransactionDate', width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    // Add data rows
    inventoryItems.forEach((item) => {
      const totalValue = Number(item.quantity) * Number(item.costPerUnit);
      const lastTransaction = item.transactions[0];

      worksheet.addRow({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        costPerUnit: Number(item.costPerUnit),
        totalValue: totalValue,
        branch: item.branch?.name || 'N/A',
        lastUpdated: formatToISODate(item.lastUpdated),
        lastTransaction: lastTransaction ? lastTransaction.category : 'N/A',
        lastTransactionDate: lastTransaction ? formatToISODate(lastTransaction.date) : 'N/A',
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.width || 10, column.header.length + 2);
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    this.logger.log(`Exported ${inventoryItems.length} inventory items to Excel`);
    return buffer as Buffer;
  }
}
