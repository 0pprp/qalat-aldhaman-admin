import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import type { CategoryDto, ProductDto } from '@/types/admin';
import ProductFormDialog from '@/components/products/ProductFormDialog';

function formatPrice(value: number | null): string {
  return value !== null ? value.toLocaleString('en-US') : '—';
}

const ProductsPage = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [products, setProducts] = useState<ProductDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<CategoryDto[]>('/api/admin/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = categoryFilter !== 'all' ? `?categoryId=${categoryFilter}` : '';
      const data = await apiFetch<ProductDto[]>(`/api/admin/products${query}`);
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEditDialog = (product: ProductDto) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/products/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="font-arabic text-2xl font-bold text-foreground">المنتجات</h1>
        <Button onClick={openAddDialog} className="font-arabic gap-2">
          <Plus className="h-4 w-4" />
          إضافة منتج جديد
        </Button>
      </div>

      <div className="mb-4 w-64">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="font-arabic">
            <SelectValue placeholder="كل الفئات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-arabic">
              كل الفئات
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()} className="font-arabic">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <Button variant="outline" className="font-arabic gap-2" onClick={loadProducts}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && !error && products && products.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-muted-foreground">لا توجد منتجات بعد</p>
          <Button onClick={openAddDialog} className="font-arabic gap-2">
            <Plus className="h-4 w-4" />
            إضافة منتج جديد
          </Button>
        </div>
      )}

      {!loading && !error && products && products.length > 0 && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-arabic text-right">اسم الموديل</TableHead>
                <TableHead className="font-arabic text-right">الفئة</TableHead>
                <TableHead className="font-arabic text-right">نقد</TableHead>
                <TableHead className="font-arabic text-right">شهري</TableHead>
                <TableHead className="font-arabic text-right">يومي</TableHead>
                <TableHead className="font-arabic text-right">الحالة</TableHead>
                <TableHead className="font-arabic text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-arabic font-medium">{product.name}</TableCell>
                  <TableCell className="font-arabic">{product.categoryName}</TableCell>
                  <TableCell>{formatPrice(product.cashPrice)}</TableCell>
                  <TableCell>{formatPrice(product.monthlyPaymentAmount)}</TableCell>
                  <TableCell>{formatPrice(product.dailyPaymentAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? 'default' : 'outline'} className="font-arabic">
                      {product.isActive ? 'فعّال' : 'معطّل'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} title="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(product);
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

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) loadProducts();
        }}
        product={editingProduct}
        categories={categories}
        onSaved={loadProducts}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف منتج "{deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
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

export default ProductsPage;
