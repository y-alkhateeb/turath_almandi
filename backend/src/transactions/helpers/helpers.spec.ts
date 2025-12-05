import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/types/prisma-enums';
import { DiscountType } from '@prisma/client';
import { resolveBranchId, validateBranchAccess, getEffectiveBranchFilter } from './branch-resolver';
import { calculateDiscount, calculateItemTotal } from './discount-calculator';
import { RequestUser } from '../../common/interfaces';

describe('Transaction Helpers', () => {
  describe('resolveBranchId', () => {
    const adminUser: RequestUser = {
      id: 'admin-1',
      username: 'admin',
      role: UserRole.ADMIN,
      branchId: null,
    };

    const accountantUser: RequestUser = {
      id: 'accountant-1',
      username: 'accountant',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const accountantWithoutBranch: RequestUser = {
      id: 'accountant-2',
      username: 'accountant2',
      role: UserRole.ACCOUNTANT,
      branchId: null,
    };

    it('should return branchId for admin when provided', () => {
      const result = resolveBranchId(adminUser, 'branch-1');
      expect(result).toBe('branch-1');
    });

    it('should throw error for admin without branchId', () => {
      expect(() => resolveBranchId(adminUser)).toThrow(BadRequestException);
      expect(() => resolveBranchId(adminUser)).toThrow('Admin must specify branchId for transaction');
    });

    it('should return user.branchId for accountant', () => {
      const result = resolveBranchId(accountantUser);
      expect(result).toBe('branch-1');
    });

    it('should throw error for accountant without branch', () => {
      expect(() => resolveBranchId(accountantWithoutBranch)).toThrow(BadRequestException);
      expect(() => resolveBranchId(accountantWithoutBranch)).toThrow('Accountant must be assigned to branch');
    });
  });

  describe('validateBranchAccess', () => {
    const adminUser: RequestUser = {
      id: 'admin-1',
      username: 'admin',
      role: UserRole.ADMIN,
      branchId: null,
    };

    const accountantUser: RequestUser = {
      id: 'accountant-1',
      username: 'accountant',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const accountantWithoutBranch: RequestUser = {
      id: 'accountant-2',
      username: 'accountant2',
      role: UserRole.ACCOUNTANT,
      branchId: null,
    };

    it('should allow admin to access any branch', () => {
      expect(() => validateBranchAccess(adminUser, 'branch-1')).not.toThrow();
      expect(() => validateBranchAccess(adminUser, 'branch-2')).not.toThrow();
    });

    it('should allow accountant to access their own branch', () => {
      expect(() => validateBranchAccess(accountantUser, 'branch-1')).not.toThrow();
    });

    it('should deny accountant access to other branch', () => {
      expect(() => validateBranchAccess(accountantUser, 'branch-2')).toThrow(ForbiddenException);
      expect(() => validateBranchAccess(accountantUser, 'branch-2')).toThrow('Access denied: Resource belongs to another branch');
    });

    it('should throw error for accountant without branch', () => {
      expect(() => validateBranchAccess(accountantWithoutBranch, 'branch-1')).toThrow(BadRequestException);
      expect(() => validateBranchAccess(accountantWithoutBranch, 'branch-1')).toThrow('Accountant must be assigned to branch');
    });
  });

  describe('getEffectiveBranchFilter', () => {
    const adminUser: RequestUser = {
      id: 'admin-1',
      username: 'admin',
      role: UserRole.ADMIN,
      branchId: null,
    };

    const accountantUser: RequestUser = {
      id: 'accountant-1',
      username: 'accountant',
      role: UserRole.ACCOUNTANT,
      branchId: 'branch-1',
    };

    const accountantWithoutBranch: RequestUser = {
      id: 'accountant-2',
      username: 'accountant2',
      role: UserRole.ACCOUNTANT,
      branchId: null,
    };

    it('should return provided branchId for admin', () => {
      expect(getEffectiveBranchFilter(adminUser, 'branch-1')).toBe('branch-1');
    });

    it('should return undefined for admin without branchId', () => {
      expect(getEffectiveBranchFilter(adminUser)).toBeUndefined();
    });

    it('should return user.branchId for accountant', () => {
      expect(getEffectiveBranchFilter(accountantUser, 'branch-2')).toBe('branch-1');
      expect(getEffectiveBranchFilter(accountantUser)).toBe('branch-1');
    });

    it('should throw error for accountant without branch', () => {
      expect(() => getEffectiveBranchFilter(accountantWithoutBranch)).toThrow(ForbiddenException);
      expect(() => getEffectiveBranchFilter(accountantWithoutBranch)).toThrow('Accountant must be assigned to branch');
    });
  });

  describe('calculateDiscount', () => {
    it('should return original amount when no discount provided', () => {
      const result = calculateDiscount(100);
      expect(Number(result.subtotal)).toBe(100);
      expect(Number(result.discountAmount)).toBe(0);
      expect(Number(result.total)).toBe(100);
    });

    it('should calculate PERCENTAGE discount correctly', () => {
      const result = calculateDiscount(100, DiscountType.PERCENTAGE, 10);
      expect(Number(result.subtotal)).toBe(100);
      expect(Number(result.discountAmount)).toBe(10);
      expect(Number(result.total)).toBe(90);
    });

    it('should calculate FIXED discount correctly', () => {
      const result = calculateDiscount(100, DiscountType.AMOUNT, 15);
      expect(Number(result.subtotal)).toBe(100);
      expect(Number(result.discountAmount)).toBe(15);
      expect(Number(result.total)).toBe(85);
    });

    it('should not allow discount to exceed subtotal', () => {
      const result = calculateDiscount(100, DiscountType.AMOUNT, 150);
      expect(Number(result.subtotal)).toBe(100);
      expect(Number(result.discountAmount)).toBe(100);
      expect(Number(result.total)).toBe(0);
    });

    it('should handle zero discount value', () => {
      const result = calculateDiscount(100, DiscountType.PERCENTAGE, 0);
      expect(Number(result.subtotal)).toBe(100);
      expect(Number(result.discountAmount)).toBe(0);
      expect(Number(result.total)).toBe(100);
    });

    it('should handle Decimal inputs', () => {
      const { Decimal } = require('@prisma/client/runtime/library');
      const result = calculateDiscount(new Decimal(100), DiscountType.PERCENTAGE, new Decimal(20));
      expect(Number(result.subtotal)).toBe(100);
      expect(Number(result.discountAmount)).toBe(20);
      expect(Number(result.total)).toBe(80);
    });
  });

  describe('calculateItemTotal', () => {
    it('should calculate subtotal (quantity * price)', () => {
      const result = calculateItemTotal(5, 10);
      expect(Number(result.subtotal)).toBe(50);
      expect(Number(result.total)).toBe(50);
    });

    it('should apply PERCENTAGE discount', () => {
      const result = calculateItemTotal(5, 10, DiscountType.PERCENTAGE, 10);
      expect(Number(result.subtotal)).toBe(50);
      expect(Number(result.discountAmount)).toBe(5);
      expect(Number(result.total)).toBe(45);
    });

    it('should apply FIXED discount', () => {
      const result = calculateItemTotal(5, 10, DiscountType.AMOUNT, 5);
      expect(Number(result.subtotal)).toBe(50);
      expect(Number(result.discountAmount)).toBe(5);
      expect(Number(result.total)).toBe(45);
    });

    it('should return subtotal when no discount', () => {
      const result = calculateItemTotal(3, 20);
      expect(Number(result.subtotal)).toBe(60);
      expect(Number(result.discountAmount)).toBe(0);
      expect(Number(result.total)).toBe(60);
    });

    it('should handle zero discount value', () => {
      const result = calculateItemTotal(5, 10, DiscountType.PERCENTAGE, 0);
      expect(Number(result.subtotal)).toBe(50);
      expect(Number(result.total)).toBe(50);
    });

    it('should handle Decimal unitPrice', () => {
      const { Decimal } = require('@prisma/client/runtime/library');
      const result = calculateItemTotal(2, new Decimal(15.5));
      expect(Number(result.subtotal)).toBe(31);
      expect(Number(result.total)).toBe(31);
    });
  });
});

