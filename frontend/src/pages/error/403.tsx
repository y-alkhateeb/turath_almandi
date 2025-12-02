import { Link } from 'react-router-dom';
import { ShieldX, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export default function Error403Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-destructive/10">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          غير مصرح
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          ليس لديك الصلاحية للوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>
    </div>
  );
}
