import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { InventoryUnit } from '@/types/enum';
import type { Branch } from '@/types/entity';

const UNIT_LABELS: Record<InventoryUnit, string> = {
  [InventoryUnit.KG]: 'كيلوغرام',
  [InventoryUnit.PIECE]: 'قطعة',
  [InventoryUnit.LITER]: 'لتر',
  [InventoryUnit.OTHER]: 'أخرى',
};

const STOCK_STATUS_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'available', label: 'متوفر (> 0)' },
  { value: 'low', label: 'منخفض (< 10)' },
  { value: 'out', label: 'نفذ (= 0)' },
];

export interface InventoryFiltersState {
  search: string;
  unit: string;
  branchId: string;
  stockStatus: string;
}

interface InventoryFiltersProps {
  filters: InventoryFiltersState;
  onFilterChange: (filters: InventoryFiltersState) => void;
  branches: Branch[];
  isAdmin: boolean;
  isLoading?: boolean;
}

export default function InventoryFilters({
  filters,
  onFilterChange,
  branches,
  isAdmin,
  isLoading,
}: InventoryFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleUnitChange = (value: string) => {
    onFilterChange({ ...filters, unit: value });
  };

  const handleBranchChange = (value: string) => {
    onFilterChange({ ...filters, branchId: value });
  };

  const handleStockStatusChange = (value: string) => {
    onFilterChange({ ...filters, stockStatus: value });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      unit: 'all',
      branchId: 'all',
      stockStatus: 'all',
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.unit !== 'all' ||
    filters.branchId !== 'all' ||
    filters.stockStatus !== 'all';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* الصف الأول - البحث والفلاتر الرئيسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن صنف..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
                disabled={isLoading}
              />
            </div>

            {/* فلتر الوحدة */}
            <Select
              value={filters.unit}
              onValueChange={handleUnitChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="الوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوحدات</SelectItem>
                {Object.entries(UNIT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* فلتر الفرع - للأدمن فقط */}
            {isAdmin && (
              <Select
                value={filters.branchId}
                onValueChange={handleBranchChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفروع</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* فلتر حالة المخزون */}
            <Select
              value={filters.stockStatus}
              onValueChange={handleStockStatusChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="حالة المخزون" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* زر مسح الفلاتر */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 ml-1" />
                مسح الفلاتر
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
