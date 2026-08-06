import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Layers } from 'lucide-react';
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
import type { CategoryDto } from '@/types/admin';
import CategoryFormDialog from '@/components/categories/CategoryFormDialog';
import PackagesDialog from '@/components/packages/PackagesDialog';

const CategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [packagesOpen, setPackagesOpen] = useState(false);
  const [packagesCategory, setPackagesCategory] = useState<CategoryDto | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CategoryDto[]>('/api/admin/categories');
      setCategories(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEditDialog = (category: CategoryDto) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const openPackagesDialog = (category: CategoryDto) => {
    setPackagesCategory(category);
    setPackagesOpen(true);
  };

  const paymentMethods = (category: CategoryDto): string[] => {
    const methods: string[] = [];
    if (category.allowsCash) methods.push('نقد');
    if (category.allowsMonthlyInstallment) methods.push('شهري');
    if (category.allowsMonthlyRafidain) methods.push('رافدين');
    if (category.allowsDailyInstallment) methods.push('يومي');
    return methods;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-arabic text-2xl font-bold text-foreground">الفئات</h1>
        <Button onClick={openAddDialog} className="font-arabic gap-2">
          <Plus className="h-4 w-4" />
          إضافة فئة جديدة
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-destructive">{error}</p>
          <Button variant="outline" className="font-arabic gap-2" onClick={loadCategories}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && !error && categories && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-muted-foreground">لا توجد فئات بعد</p>
          <Button onClick={openAddDialog} className="font-arabic gap-2">
            <Plus className="h-4 w-4" />
            إضافة فئة جديدة
          </Button>
        </div>
      )}

      {!loading && !error && categories && categories.length > 0 && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-arabic text-right">الاسم</TableHead>
                <TableHead className="font-arabic text-right">طرق الدفع</TableHead>
                <TableHead className="font-arabic text-right">صاحب محل؟</TableHead>
                <TableHead className="font-arabic text-right">باقات؟</TableHead>
                <TableHead className="font-arabic text-right">الحالة</TableHead>
                <TableHead className="font-arabic text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-arabic font-medium">{category.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {paymentMethods(category).map((m) => (
                        <Badge key={m} variant="secondary" className="font-arabic">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-arabic">{category.requiresShopOwner ? 'نعم' : 'لا'}</TableCell>
                  <TableCell className="font-arabic">{category.usesPackages ? 'نعم' : 'لا'}</TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? 'default' : 'outline'} className="font-arabic">
                      {category.isActive ? 'فعّال' : 'معطّل'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {category.usesPackages && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPackagesDialog(category)}
                          title="الباقات"
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)} title="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(category);
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

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSaved={loadCategories}
      />

      <PackagesDialog open={packagesOpen} onOpenChange={setPackagesOpen} category={packagesCategory} />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف فئة "{deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
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
    </div>
  );
};

export default CategoriesPage;
