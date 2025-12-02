import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function EmployeeDetailPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تفاصيل الموظف</h1>
      <Card>
        <CardHeader>
          <CardTitle>معلومات الموظف</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            صفحة تفاصيل الموظف - سيتم بناؤها قريباً.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
