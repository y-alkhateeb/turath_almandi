import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTemplates, useDeleteTemplate } from '@/hooks/queries/useSmartReports';
import { Loader2, Trash2, Download, Star } from 'lucide-react';
import { useState } from 'react';
import type { ReportConfiguration } from '@/types/smart-reports.types';
import { toast } from 'sonner';

interface TemplateManagerProps {
  currentConfig: ReportConfiguration;
  onLoadTemplate: (config: ReportConfiguration) => void;
}

export function TemplateManager({ currentConfig, onLoadTemplate }: TemplateManagerProps) {
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleLoadTemplate = (config: ReportConfiguration) => {
    onLoadTemplate(config);
    toast.success('تم تحميل القالب بنجاح');
  };

  const handleDeleteTemplate = async () => {
    if (!deleteId) return;

    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success('تم حذف القالب بنجاح');
      setDeleteId(null);
    } catch (error) {
      toast.error('فشل حذف القالب');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500">{template.description}</p>
                    )}
                    <div className="flex gap-2 text-xs text-gray-400">
                      <span>{template.reportType}</span>
                      <span>•</span>
                      <span>
                        {template.config.fields.filter((f) => f.visible).length} حقل
                      </span>
                      <span>•</span>
                      <span>{template.config.filters.length} فلتر</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadTemplate(template.config)}
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تحميل
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">لا توجد قوالب محفوظة</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا القالب نهائيًا. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
