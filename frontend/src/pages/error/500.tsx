import { Link } from 'react-router-dom';
import { ServerCrash, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

export default function Error500Page() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-destructive/10">
            <ServerCrash className="h-16 w-16 text-destructive" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          خطأ في الخادم
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم الفني.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة المحاولة
          </Button>
          <Button asChild>
            <Link to="/">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
