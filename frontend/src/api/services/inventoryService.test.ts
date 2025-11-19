/**
 * Inventory Service Tests
 * Tests for inventory management API service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockApiClient, mockSuccess, mockError, verifyRequest, resetApiClientMocks } from '@/test/apiClientMock';
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput } from '#/entity';
import type { PaginatedResponse, InventoryQueryFilters } from '#/api';

// Mock the apiClient module
vi.mock('../apiClient', () => ({
  default: mockApiClient,
}));

// Import after mocking
import * as inventoryService from './inventoryService';
import { InventoryApiEndpoints } from './inventoryService';

describe('inventoryService', () => {
  const mockInventoryItem: InventoryItem = {
    id: 'item-123',
    name: 'Test Item',
    quantity: 100,
    unit: 'kg',
    costPerUnit: 10,
    totalValue: 1000,
    notes: 'Test notes',
    autoAdded: false,
    branchId: 'branch-123',
    createdById: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    resetApiClientMocks();
  });

  describe('getAll', () => {
    const mockPaginatedResponse: PaginatedResponse<InventoryItem> = {
      data: [mockInventoryItem],
      meta: {
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    };

    it('should get all inventory items with default pagination', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = await inventoryService.getAll();

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: undefined,
      });
    });

    it('should get inventory items with filters', async () => {
      const filters: InventoryQueryFilters = {
        unit: 'kg',
        branchId: 'branch-123',
        autoAdded: false,
        search: 'Test',
        page: 2,
        limit: 20,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await inventoryService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by unit', async () => {
      const filters: InventoryQueryFilters = {
        unit: 'liter',
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await inventoryService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should filter by autoAdded', async () => {
      const filters: InventoryQueryFilters = {
        autoAdded: true,
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      await inventoryService.getAll(filters);

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: filters,
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(inventoryService.getAll()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockPaginatedResponse));

      const result = inventoryService.getAll();

      const _typeCheck: Promise<PaginatedResponse<InventoryItem>> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getOne', () => {
    it('should get inventory item by ID', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = await inventoryService.getOne('item-123');

      expect(result).toEqual(mockInventoryItem);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: '/inventory/item-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(404, 'Item not found'));

      await expect(inventoryService.getOne('nonexistent')).rejects.toThrow('Item not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.get.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(inventoryService.getOne('item-123')).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = inventoryService.getOne('item-123');

      const _typeCheck: Promise<InventoryItem> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('create', () => {
    const createData: CreateInventoryInput = {
      name: 'New Item',
      quantity: 50,
      unit: 'piece',
      costPerUnit: 5,
      notes: 'New item notes',
      branchId: 'branch-123',
    };

    it('should create inventory item successfully', async () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = await inventoryService.create(createData);

      expect(result).toEqual(mockInventoryItem);
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.post, {
        url: InventoryApiEndpoints.Create,
        data: createData,
      });
    });

    it('should create item without notes', async () => {
      const { notes, ...dataWithoutNotes } = createData;

      mockApiClient.post.mockReturnValue(mockSuccess(mockInventoryItem));

      await inventoryService.create(dataWithoutNotes);

      verifyRequest(mockApiClient.post, {
        url: InventoryApiEndpoints.Create,
        data: dataWithoutNotes,
      });
    });

    it('should create item with different unit types', async () => {
      const units = ['kg', 'liter', 'piece', 'box'];

      for (const unit of units) {
        const data = { ...createData, unit };
        mockApiClient.post.mockReturnValue(mockSuccess({ ...mockInventoryItem, unit }));

        await inventoryService.create(data);

        verifyRequest(mockApiClient.post, {
          url: InventoryApiEndpoints.Create,
          data,
        });

        resetApiClientMocks();
      }
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.post.mockReturnValue(mockError(400, 'Quantity must be positive'));

      await expect(inventoryService.create(createData)).rejects.toThrow('Quantity must be positive');
    });

    it('should handle 401 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(inventoryService.create(createData)).rejects.toThrow('Not authenticated');
    });

    it('should handle 403 error', async () => {
      mockApiClient.post.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(inventoryService.create(createData)).rejects.toThrow('Forbidden');
    });

    it('should handle 404 error for invalid branchId', async () => {
      mockApiClient.post.mockReturnValue(mockError(404, 'Branch not found'));

      await expect(inventoryService.create(createData)).rejects.toThrow('Branch not found');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.post.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = inventoryService.create(createData);

      const _typeCheck: Promise<InventoryItem> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('update', () => {
    const updateData: UpdateInventoryInput = {
      name: 'Updated Item',
      quantity: 75,
      costPerUnit: 12,
      notes: 'Updated notes',
    };

    it('should update inventory item successfully', async () => {
      const updatedItem = { ...mockInventoryItem, ...updateData };
      mockApiClient.patch.mockReturnValue(mockSuccess(updatedItem));

      const result = await inventoryService.update('item-123', updateData);

      expect(result).toEqual(updatedItem);
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.patch, {
        url: '/inventory/item-123',
        data: updateData,
      });
    });

    it('should update only name', async () => {
      const nameUpdate = { name: 'New Name' };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      await inventoryService.update('item-123', nameUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/inventory/item-123',
        data: nameUpdate,
      });
    });

    it('should update only quantity', async () => {
      const quantityUpdate = { quantity: 200 };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      await inventoryService.update('item-123', quantityUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/inventory/item-123',
        data: quantityUpdate,
      });
    });

    it('should update only costPerUnit', async () => {
      const costUpdate = { costPerUnit: 15 };
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      await inventoryService.update('item-123', costUpdate);

      verifyRequest(mockApiClient.patch, {
        url: '/inventory/item-123',
        data: costUpdate,
      });
    });

    it('should handle 400 validation error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(400, 'Invalid quantity'));

      await expect(inventoryService.update('item-123', updateData)).rejects.toThrow('Invalid quantity');
    });

    it('should handle 404 error', async () => {
      mockApiClient.patch.mockReturnValue(mockError(404, 'Item not found'));

      await expect(inventoryService.update('nonexistent', updateData)).rejects.toThrow('Item not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.patch.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(inventoryService.update('item-123', updateData)).rejects.toThrow('Forbidden');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = inventoryService.update('item-123', updateData);

      const _typeCheck: Promise<InventoryItem> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('deleteInventory', () => {
    it('should delete inventory item successfully', async () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      await inventoryService.deleteInventory('item-123');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.delete, {
        url: '/inventory/item-123',
      });
    });

    it('should handle 404 error', async () => {
      mockApiClient.delete.mockReturnValue(mockError(404, 'Item not found'));

      await expect(inventoryService.deleteInventory('nonexistent')).rejects.toThrow('Item not found');
    });

    it('should handle 403 error for wrong branch', async () => {
      mockApiClient.delete.mockReturnValue(mockError(403, 'Forbidden'));

      await expect(inventoryService.deleteInventory('item-123')).rejects.toThrow('Forbidden');
    });

    it('should handle 409 conflict error for items with consumption history', async () => {
      mockApiClient.delete.mockReturnValue(mockError(409, 'Cannot delete item with consumption history'));

      await expect(inventoryService.deleteInventory('item-123')).rejects.toThrow('Cannot delete item with consumption history');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.delete.mockReturnValue(mockSuccess(undefined));

      const result = inventoryService.deleteInventory('item-123');

      const _typeCheck: Promise<void> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getValue', () => {
    it('should get total inventory value without branchId', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(5000));

      const result = await inventoryService.getValue();

      expect(result).toBe(5000);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetValue,
        params: undefined,
      });
    });

    it('should get total inventory value with branchId', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(3000));

      const result = await inventoryService.getValue('branch-123');

      expect(result).toBe(3000);
      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetValue,
        params: { branchId: 'branch-123' },
      });
    });

    it('should handle 401 error', async () => {
      mockApiClient.get.mockReturnValue(mockError(401, 'Not authenticated'));

      await expect(inventoryService.getValue()).rejects.toThrow('Not authenticated');
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(5000));

      const result = inventoryService.getValue();

      const _typeCheck: Promise<number> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getAllUnpaginated', () => {
    it('should extract data array from paginated response', async () => {
      const mockResponse: PaginatedResponse<InventoryItem> = {
        data: [mockInventoryItem],
        meta: {
          total: 1,
          page: 1,
          limit: 10000,
          totalPages: 1,
        },
      };

      mockApiClient.get.mockReturnValue(mockSuccess(mockResponse));

      const result = await inventoryService.getAllUnpaginated();

      expect(result).toEqual([mockInventoryItem]);
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { limit: 10000 },
      });
    });

    it('should pass filters without page and limit', async () => {
      const filters = {
        unit: 'kg',
        branchId: 'branch-123',
      };

      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockInventoryItem], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      await inventoryService.getAllUnpaginated(filters);

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { ...filters, limit: 10000 },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockInventoryItem], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      const result = inventoryService.getAllUnpaginated();

      const _typeCheck: Promise<InventoryItem[]> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('getManualItems', () => {
    it('should get items with autoAdded=false', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [mockInventoryItem], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }));

      await inventoryService.getManualItems();

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { autoAdded: false },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await inventoryService.getManualItems({ branchId: 'branch-123' });

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { autoAdded: false, branchId: 'branch-123' },
      });
    });
  });

  describe('getAutoItems', () => {
    it('should get items with autoAdded=true', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await inventoryService.getAutoItems();

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { autoAdded: true },
      });
    });
  });

  describe('getByUnit', () => {
    it('should get items by unit type', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await inventoryService.getByUnit('kg');

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { unit: 'kg' },
      });
    });

    it('should pass additional filters', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } }));

      await inventoryService.getByUnit('liter', { branchId: 'branch-123' });

      verifyRequest(mockApiClient.get, {
        url: InventoryApiEndpoints.GetAll,
        params: { unit: 'liter', branchId: 'branch-123' },
      });
    });
  });

  describe('getLowStock', () => {
    it('should get items with quantity below default threshold', async () => {
      const lowStockItem = { ...mockInventoryItem, quantity: 5 };
      const normalStockItem = { ...mockInventoryItem, id: 'item-456', quantity: 50 };

      mockApiClient.get.mockReturnValue(mockSuccess({ data: [lowStockItem, normalStockItem], meta: { total: 2, page: 1, limit: 10000, totalPages: 1 } }));

      const result = await inventoryService.getLowStock();

      expect(result).toEqual([lowStockItem]);
      expect(result.length).toBe(1);
    });

    it('should get items with quantity below custom threshold', async () => {
      const lowStockItem = { ...mockInventoryItem, quantity: 20 };

      mockApiClient.get.mockReturnValue(mockSuccess({ data: [lowStockItem], meta: { total: 1, page: 1, limit: 10000, totalPages: 1 } }));

      const result = await inventoryService.getLowStock(25);

      expect(result).toEqual([lowStockItem]);
    });

    it('should filter items client-side', async () => {
      const items = [
        { ...mockInventoryItem, id: 'item-1', quantity: 5 },
        { ...mockInventoryItem, id: 'item-2', quantity: 15 },
        { ...mockInventoryItem, id: 'item-3', quantity: 8 },
      ];

      mockApiClient.get.mockReturnValue(mockSuccess({ data: items, meta: { total: 3, page: 1, limit: 10000, totalPages: 1 } }));

      const result = await inventoryService.getLowStock(10);

      expect(result.length).toBe(2);
      expect(result.map((i) => i.id)).toEqual(['item-1', 'item-3']);
    });
  });

  describe('updateQuantity', () => {
    it('should update only quantity field', async () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      await inventoryService.updateQuantity('item-123', 150);

      verifyRequest(mockApiClient.patch, {
        url: '/inventory/item-123',
        data: { quantity: 150 },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = inventoryService.updateQuantity('item-123', 150);

      const _typeCheck: Promise<InventoryItem> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('adjustQuantity', () => {
    it('should increase quantity by delta', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryItem));
      mockApiClient.patch.mockReturnValue(mockSuccess({ ...mockInventoryItem, quantity: 120 }));

      const result = await inventoryService.adjustQuantity('item-123', 20);

      expect(mockApiClient.get).toHaveBeenCalledWith({ url: '/inventory/item-123' });
      expect(mockApiClient.patch).toHaveBeenCalledWith({
        url: '/inventory/item-123',
        data: { quantity: 120 },
      });
      expect(result.quantity).toBe(120);
    });

    it('should decrease quantity by negative delta', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryItem));
      mockApiClient.patch.mockReturnValue(mockSuccess({ ...mockInventoryItem, quantity: 80 }));

      const result = await inventoryService.adjustQuantity('item-123', -20);

      expect(mockApiClient.patch).toHaveBeenCalledWith({
        url: '/inventory/item-123',
        data: { quantity: 80 },
      });
      expect(result.quantity).toBe(80);
    });

    it('should not allow quantity below zero', async () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryItem));
      mockApiClient.patch.mockReturnValue(mockSuccess({ ...mockInventoryItem, quantity: 0 }));

      await inventoryService.adjustQuantity('item-123', -200);

      expect(mockApiClient.patch).toHaveBeenCalledWith({
        url: '/inventory/item-123',
        data: { quantity: 0 },
      });
    });

    it('should have correct TypeScript types', () => {
      mockApiClient.get.mockReturnValue(mockSuccess(mockInventoryItem));
      mockApiClient.patch.mockReturnValue(mockSuccess(mockInventoryItem));

      const result = inventoryService.adjustQuantity('item-123', 10);

      const _typeCheck: Promise<InventoryItem> = result;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('InventoryApiEndpoints', () => {
    it('should have correct endpoint values', () => {
      expect(InventoryApiEndpoints.GetAll).toBe('/inventory');
      expect(InventoryApiEndpoints.GetOne).toBe('/inventory/:id');
      expect(InventoryApiEndpoints.Create).toBe('/inventory');
      expect(InventoryApiEndpoints.Update).toBe('/inventory/:id');
      expect(InventoryApiEndpoints.Delete).toBe('/inventory/:id');
      expect(InventoryApiEndpoints.GetValue).toBe('/inventory/value');
    });
  });

  describe('default export', () => {
    it('should export service object with all methods', () => {
      expect(inventoryService.default).toBeDefined();
      expect(inventoryService.default.getAll).toBe(inventoryService.getAll);
      expect(inventoryService.default.getAllUnpaginated).toBe(inventoryService.getAllUnpaginated);
      expect(inventoryService.default.getOne).toBe(inventoryService.getOne);
      expect(inventoryService.default.create).toBe(inventoryService.create);
      expect(inventoryService.default.update).toBe(inventoryService.update);
      expect(inventoryService.default.delete).toBe(inventoryService.deleteInventory);
      expect(inventoryService.default.getValue).toBe(inventoryService.getValue);
      expect(inventoryService.default.getManualItems).toBe(inventoryService.getManualItems);
      expect(inventoryService.default.getAutoItems).toBe(inventoryService.getAutoItems);
      expect(inventoryService.default.getByUnit).toBe(inventoryService.getByUnit);
      expect(inventoryService.default.getLowStock).toBe(inventoryService.getLowStock);
      expect(inventoryService.default.updateQuantity).toBe(inventoryService.updateQuantity);
      expect(inventoryService.default.adjustQuantity).toBe(inventoryService.adjustQuantity);
    });
  });
});
