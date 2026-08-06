import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { apiFetch, ApiError } from '@/lib/api';
import type { CategoryDto, PackageDto } from '@/types/admin';
import PackageFormDialog from './PackageFormDialog';

interface PackagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDto | null;
}

function formatMoney(value: number): string {
  return `${value.toLocaleString('en-US')} د.ع`;
}

const PackagesDialog = ({ open, onOpenChange, category }: PackagesDialogProps) => {
  const [packages, setPackages] = useState<PackageDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageDto | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PackageDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPackages = useCallback(async () => {
    if (!category) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PackageDto[]>(`/api/admin/packages?categoryId=${category.id}`);
      setPackages(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open, loadPackages]);

  const openAddDialog = () => {
    setEditingPackage(null);
    setFormOpen(true);
  };

  const openEditDialog = (pkg: PackageDto) => {
    setEditingPackage(pkg);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/packages/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadPackages();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setDeleting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-arabic">باقات فئة "{category.name}"</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-end">
          <Button onClick={openAddDialog} className="font-arabic gap-2">
            <Plus className="h-4 w-4" />
            إضافة باقة جديدة
          </Button>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-10">
            <p className="font-arabic text-destructive">{error}</p>
            <Button variant="outline" className="font-arabic gap-2" onClick={loadPackages}>
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {!loading && !error && packages && packages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-10">
            <p className="font-arabic text-muted-foreground">لا توجد باقات بعد</p>
          </div>
        )}

        {!loading && !error && packages && packages.length > 0 && (
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-arabic text-right">الاسم</TableHead>
                  <TableHead className="font-arabic text-right">الحد الأدنى</TableHead>
                  <TableHead className="font-arabic text-right">ترتيب العرض</TableHead>
                  <TableHead className="font-arabic text-right">الحالة</TableHead>
                  <TableHead className="font-arabic text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-arabic font-medium">{pkg.name}</TableCell>
                    <TableCell>{formatMoney(pkg.minimumTotalPrice)}</TableCell>
                    <TableCell>{pkg.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.isActive ? 'default' : 'outline'} className="font-arabic">
                        {pkg.isActive ? 'فعّال' : 'معطّل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(pkg)} title="تعديل">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeleteTarget(pkg);
                            setDeleteError(null);
                          }}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="font-arabic" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>

      <PackageFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categoryId={category.id}
        pkg={editingPackage}
        onSaved={loadPackages}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف باقة "{deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive font-arabic">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel className="font-arabic" disabled={deleting}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="font-arabic bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default PackagesDialog;
