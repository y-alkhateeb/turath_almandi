import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionType, PaymentMethod, UserRole } from '../common/types/prisma-enums';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Category } from '../common/constants/transaction-categories';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    createIncome: jest.fn(),
    createExpense: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getSummary: jest.fn(),
  };

  const adminUser = {
    id: 'admin-1',
    username: 'admin',
    role: UserRole.ADMIN,
    branchId: null,
  };

  const mockTransaction = {
    id: 'txn-1',
    type: TransactionType.INCOME,
    amount: 100,
    paymentMethod: PaymentMethod.CASH,
    category: 'INVENTORY_SALES',
    date: '2024-01-01',
    branchId: 'branch-1',
    createdBy: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /transactions/income', () => {
    it('should create income with valid request', async () => {
      const createIncomeDto = {
        date: '2024-01-01',
        category: Category.INVENTORY_SALES,
        paymentMethod: PaymentMethod.CASH,
        amount: 100,
      };

      mockTransactionsService.createIncome.mockResolvedValue(mockTransaction);

      const result = await controller.createIncome(createIncomeDto, adminUser);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionsService.createIncome).toHaveBeenCalledWith(createIncomeDto, adminUser);
    });

    it('should handle validation error', async () => {
      const invalidDto = {
        date: '2024-01-01',
        category: 'INVENTORY_SALES',
        // Missing required paymentMethod
      } as any;

      mockTransactionsService.createIncome.mockRejectedValue(new BadRequestException('Validation failed'));

      await expect(controller.createIncome(invalidDto, adminUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /transactions/expense', () => {
    it('should create expense with valid request', async () => {
      const createExpenseDto = {
        date: '2024-01-01',
        category: Category.SUPPLIES,
        amount: 200,
      };

      const expenseTransaction = {
        ...mockTransaction,
        type: TransactionType.EXPENSE,
        amount: 200,
      };

      mockTransactionsService.createExpense.mockResolvedValue(expenseTransaction);

      const result = await controller.createExpense(createExpenseDto, adminUser);

      expect(result).toEqual(expenseTransaction);
      expect(mockTransactionsService.createExpense).toHaveBeenCalledWith(createExpenseDto, adminUser);
    });

    it('should handle validation error', async () => {
      const invalidDto = {
        date: '2024-01-01',
        // Missing required category
      } as any;

      mockTransactionsService.createExpense.mockRejectedValue(new BadRequestException('Validation failed'));

      await expect(controller.createExpense(invalidDto, adminUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /transactions', () => {
    it('should return transactions with filters', async () => {
      const mockResponse = {
        data: [mockTransaction],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(
        adminUser,
        '1',
        '10',
        TransactionType.INCOME,
        'branch-1',
        'INVENTORY_SALES',
        PaymentMethod.CASH,
        '2024-01-01',
        '2024-01-31',
        'search term',
      );

      expect(result).toEqual(mockResponse);
      expect(mockTransactionsService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return transaction when found', async () => {
      mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne('txn-1', adminUser);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionsService.findOne).toHaveBeenCalledWith('txn-1', adminUser);
    });

    it('should throw NotFoundException when not found', async () => {
      mockTransactionsService.findOne.mockRejectedValue(new NotFoundException('Transaction not found'));

      await expect(controller.findOne('non-existent', adminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PUT /transactions/:id', () => {
    it('should update transaction with valid data', async () => {
      const updateDto = {
        amount: 150,
        notes: 'Updated notes',
      };

      const updatedTransaction = {
        ...mockTransaction,
        ...updateDto,
      };

      mockTransactionsService.update.mockResolvedValue(updatedTransaction);

      const result = await controller.update('txn-1', updateDto, adminUser);

      expect(result).toEqual(updatedTransaction);
      expect(mockTransactionsService.update).toHaveBeenCalledWith('txn-1', updateDto, adminUser);
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('should delete transaction successfully', async () => {
      const deleteResponse = {
        message: 'Transaction deleted successfully',
        id: 'txn-1',
      };

      mockTransactionsService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('txn-1', adminUser);

      expect(result).toEqual(deleteResponse);
      expect(mockTransactionsService.remove).toHaveBeenCalledWith('txn-1', adminUser);
    });
  });

  describe('GET /transactions/summary', () => {
    it('should return summary with params', async () => {
      const mockSummary = {
        date: '2024-01-01',
        branchId: 'branch-1',
        income_cash: 1000,
        income_master: 500,
        total_income: 1500,
        total_expense: 300,
        net: 1200,
      };

      mockTransactionsService.getSummary.mockResolvedValue(mockSummary);

      const result = await controller.getSummary('2024-01-01', 'branch-1', adminUser);

      expect(result).toEqual(mockSummary);
      expect(mockTransactionsService.getSummary).toHaveBeenCalledWith('2024-01-01', 'branch-1', adminUser);
    });
  });
});

