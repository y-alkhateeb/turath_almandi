import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الموظفين</h1>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            صفحة الموظفين - سيتم بناؤها قريباً.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
