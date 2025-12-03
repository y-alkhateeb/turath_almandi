import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  CARD_VARIANT_STYLES, 
  ICON_VARIANT_STYLES, 
  TEXT_VARIANT_STYLES, 
  type VariantType 
} from '@/constants/variant-styles';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: VariantType;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable stat card component with consistent styling
 * Used for displaying statistics with icon, label, and value
 */
export function StatCard({ 
  label, 
  value, 
  icon, 
  variant = 'default', 
  isLoading,
  className 
}: StatCardProps) {
  return (
    <Card className={cn('border', CARD_VARIANT_STYLES[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', ICON_VARIANT_STYLES[variant])}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <div className="h-7 w-12 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className={cn('text-2xl font-bold', TEXT_VARIANT_STYLES[variant])}>
                {value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
