import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import { TransactionType, DebtStatus, UserRole } from '@prisma/client';
import { applyBranchFilter } from '../common/utils/query-builder';
import { formatToISODate } from '../common/utils/date.utils';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

interface ReportFilters {
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a comprehensive financial report with transactions summary
   * @param user - Current user for access control
   * @param filters - Optional filters for transactions
   * @returns PDF file as Buffer
   */
  async generateFinancialReport(user: RequestUser, filters: ReportFilters = {}): Promise<Buffer> {
    this.logger.log('Generating financial report PDF');

    // Build where clause with filters and user role
    let where: any = {};
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
      },
    });

    // Calculate financial summary
    const income = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = income - expenses;

    // Group by category
    const categoryBreakdown = transactions.reduce(
      (acc, t) => {
        const category = t.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { income: 0, expense: 0 };
        }
        if (t.type === TransactionType.INCOME) {
          acc[category].income += Number(t.amount);
        } else {
          acc[category].expense += Number(t.amount);
        }
        return acc;
      },
      {} as Record<string, { income: number; expense: number }>,
    );

    // Create PDF document
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Financial Report', { align: 'center' })
        .moveDown(0.5);

      // Report metadata
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
        .text(`Report Period: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`, {
          align: 'center',
        })
        .moveDown(1);

      // Summary section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Financial Summary')
        .moveDown(0.5);

      const summaryY = doc.y;

      // Summary box
      doc
        .rect(50, summaryY, 495, 80)
        .stroke();

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Total Income:', 60, summaryY + 15, { continued: true })
        .font('Helvetica')
        .text(`  $${income.toFixed(2)}`, { align: 'left' });

      doc
        .font('Helvetica-Bold')
        .text('Total Expenses:', 60, summaryY + 35, { continued: true })
        .font('Helvetica')
        .text(`  $${expenses.toFixed(2)}`, { align: 'left' });

      doc
        .font('Helvetica-Bold')
        .text('Net Profit/Loss:', 60, summaryY + 55, { continued: true })
        .font('Helvetica')
        .fillColor(netProfit >= 0 ? 'green' : 'red')
        .text(`  $${netProfit.toFixed(2)}`, { align: 'left' })
        .fillColor('black');

      doc.moveDown(2);

      // Category breakdown
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Category Breakdown')
        .moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 380;

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Category', col1, tableTop)
        .text('Income', col2, tableTop)
        .text('Expense', col3, tableTop);

      doc
        .moveTo(col1, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke();

      let currentY = tableTop + 25;

      Object.entries(categoryBreakdown).forEach(([category, amounts]) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(category, col1, currentY, { width: 180 })
          .text(`$${amounts.income.toFixed(2)}`, col2, currentY)
          .text(`$${amounts.expense.toFixed(2)}`, col3, currentY);

        currentY += 20;
      });

      doc.moveDown(2);

      // Recent transactions
      if (currentY > 600) {
        doc.addPage();
        currentY = 50;
      }

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Recent Transactions', 50, currentY)
        .moveDown(0.5);

      currentY = doc.y;

      // Transaction table header
      const txCol1 = 50;
      const txCol2 = 120;
      const txCol3 = 200;
      const txCol4 = 280;
      const txCol5 = 380;

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Date', txCol1, currentY)
        .text('Type', txCol2, currentY)
        .text('Category', txCol3, currentY)
        .text('Amount', txCol4, currentY)
        .text('Branch', txCol5, currentY);

      doc
        .moveTo(txCol1, currentY + 12)
        .lineTo(545, currentY + 12)
        .stroke();

      currentY += 20;

      // Show last 20 transactions
      transactions.slice(0, 20).forEach((transaction) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }

        doc
          .fontSize(8)
          .font('Helvetica')
          .text(formatToISODate(transaction.date), txCol1, currentY, { width: 60 })
          .text(transaction.type, txCol2, currentY, { width: 70 })
          .text(transaction.category || 'N/A', txCol3, currentY, { width: 70 })
          .text(`$${Number(transaction.amount).toFixed(2)}`, txCol4, currentY, { width: 90 })
          .text(transaction.branch?.name || 'N/A', txCol5, currentY, { width: 150 });

        currentY += 18;
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: 'center' },
          );
      }

      doc.end();
    });
  }

  /**
   * Generate a comprehensive debt report with payment tracking
   * @param user - Current user for access control
   * @param filters - Optional filters for debts
   * @returns PDF file as Buffer
   */
  async generateDebtReport(user: RequestUser, filters: ReportFilters = {}): Promise<Buffer> {
    this.logger.log('Generating debt report PDF');

    // Build where clause with filters and user role
    let where: any = {};
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
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    // Calculate debt summary
    const totalDebts = debts.reduce((sum, d) => sum + Number(d.originalAmount), 0);
    const totalRemaining = debts.reduce((sum, d) => sum + Number(d.remainingAmount), 0);
    const totalPaid = totalDebts - totalRemaining;

    const activeDebts = debts.filter((d) => d.status === DebtStatus.ACTIVE).length;
    const partialDebts = debts.filter((d) => d.status === DebtStatus.PARTIAL).length;
    const paidDebts = debts.filter((d) => d.status === DebtStatus.PAID).length;

    // Create PDF document
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Debt Report', { align: 'center' })
        .moveDown(0.5);

      // Report metadata
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
        .text(`Report Period: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`, {
          align: 'center',
        })
        .moveDown(1);

      // Summary section
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Debt Summary')
        .moveDown(0.5);

      const summaryY = doc.y;

      // Summary box
      doc
        .rect(50, summaryY, 495, 120)
        .stroke();

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Total Debt Amount:', 60, summaryY + 15, { continued: true })
        .font('Helvetica')
        .text(`  $${totalDebts.toFixed(2)}`, { align: 'left' });

      doc
        .font('Helvetica-Bold')
        .text('Total Paid:', 60, summaryY + 35, { continued: true })
        .font('Helvetica')
        .fillColor('green')
        .text(`  $${totalPaid.toFixed(2)}`, { align: 'left' })
        .fillColor('black');

      doc
        .font('Helvetica-Bold')
        .text('Total Remaining:', 60, summaryY + 55, { continued: true })
        .font('Helvetica')
        .fillColor('red')
        .text(`  $${totalRemaining.toFixed(2)}`, { align: 'left' })
        .fillColor('black');

      doc
        .font('Helvetica-Bold')
        .text('Status Breakdown:', 60, summaryY + 80, { continued: false })
        .font('Helvetica')
        .text(
          `  Active: ${activeDebts} | Partial: ${partialDebts} | Paid: ${paidDebts}`,
          { align: 'left' },
        );

      doc.moveDown(2);

      // Debt details table
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Debt Details')
        .moveDown(0.5);

      let currentY = doc.y;

      // Table header
      const col1 = 50;
      const col2 = 150;
      const col3 = 250;
      const col4 = 330;
      const col5 = 410;
      const col6 = 480;

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Creditor', col1, currentY)
        .text('Original', col2, currentY)
        .text('Remaining', col3, currentY)
        .text('Due Date', col4, currentY)
        .text('Status', col5, currentY)
        .text('Branch', col6, currentY);

      doc
        .moveTo(col1, currentY + 12)
        .lineTo(545, currentY + 12)
        .stroke();

      currentY += 20;

      debts.forEach((debt) => {
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }

        // Debt row
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(debt.creditorName, col1, currentY, { width: 90 })
          .text(`$${Number(debt.originalAmount).toFixed(2)}`, col2, currentY, { width: 90 })
          .text(`$${Number(debt.remainingAmount).toFixed(2)}`, col3, currentY, { width: 70 })
          .text(formatToISODate(debt.dueDate), col4, currentY, { width: 70 })
          .text(debt.status, col5, currentY, { width: 60 })
          .text(debt.branch?.name || 'N/A', col6, currentY, { width: 60 });

        currentY += 18;

        // Show payments if any
        if (debt.payments.length > 0) {
          doc.fontSize(7).font('Helvetica-Oblique');

          debt.payments.slice(0, 3).forEach((payment) => {
            if (currentY > 750) {
              doc.addPage();
              currentY = 50;
            }

            doc
              .fillColor('gray')
              .text(
                `  Payment: $${Number(payment.amountPaid).toFixed(2)} on ${formatToISODate(payment.paymentDate)}`,
                col1 + 10,
                currentY,
              )
              .fillColor('black');

            currentY += 12;
          });

          if (debt.payments.length > 3) {
            doc
              .fillColor('gray')
              .text(`  ... and ${debt.payments.length - 3} more payments`, col1 + 10, currentY)
              .fillColor('black');
            currentY += 12;
          }

          currentY += 8;
        }
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .font('Helvetica')
          .text(
            `Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: 'center' },
          );
      }

      doc.end();
    });
  }
}
