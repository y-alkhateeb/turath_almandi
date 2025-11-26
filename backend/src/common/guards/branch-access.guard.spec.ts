import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { BranchAccessGuard } from './branch-access.guard';
import { ERROR_MESSAGES } from '../constants/error-messages';

describe('BranchAccessGuard', () => {
  let guard: BranchAccessGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    guard = new BranchAccessGuard();

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should allow access for admin without branch', () => {
      const mockRequest = {
        user: {
          id: 'admin-id',
          username: 'admin',
          role: 'ADMIN',
          branchId: null,
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access for admin with branch', () => {
      const mockRequest = {
        user: {
          id: 'admin-id',
          username: 'admin',
          role: 'ADMIN',
          branchId: 'branch-1',
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access for accountant with branch', () => {
      const mockRequest = {
        user: {
          id: 'accountant-id',
          username: 'accountant',
          role: 'ACCOUNTANT',
          branchId: 'branch-1',
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for accountant without branch', () => {
      const mockRequest = {
        user: {
          id: 'accountant-id',
          username: 'accountant',
          role: 'ACCOUNTANT',
          branchId: null,
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ERROR_MESSAGES.BRANCH.ACCOUNTANT_NO_ACCESS,
      );
    });

    it('should throw ForbiddenException for accountant with undefined branchId', () => {
      const mockRequest = {
        user: {
          id: 'accountant-id',
          username: 'accountant',
          role: 'ACCOUNTANT',
          branchId: undefined,
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not authenticated', () => {
      const mockRequest = {
        user: null,
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException if user is undefined', () => {
      const mockRequest = {};

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should handle different role casing correctly', () => {
      const mockRequest = {
        user: {
          id: 'user-id',
          username: 'user',
          role: 'ACCOUNTANT', // Uppercase
          branchId: 'branch-1',
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access for other roles without branch check', () => {
      // Test for potential future roles
      const mockRequest = {
        user: {
          id: 'user-id',
          username: 'user',
          role: 'MANAGER', // Different role
          branchId: null,
        },
      };

      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
