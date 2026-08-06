import { useCallback, useEffect, useState } from 'react';
import { Eye, Trash2, RefreshCw, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import type { CategoryDto, Governorate, OrderListItemDto, OrderStatus, PurchaseMethod } from '@/types/admin';
import OrderDetailDialog from '@/components/orders/OrderDetailDialog';
import { STATUS_LABELS, STATUS_BADGE_CLASS, PURCHASE_METHOD_LABELS } from '@/components/orders/orderConstants';

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'ContactedByRep', 'Confirmed', 'Rejected', 'Completed'];
const PURCHASE_METHOD_OPTIONS: PurchaseMethod[] = ['Cash', 'MonthlyInstallment', 'MonthlyRafidain', 'DailyInstallment'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const OrdersPage = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');

  const [orders, setOrders] = useState<OrderListItemDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OrderListItemDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<CategoryDto[]>('/api/admin/categories').then(setCategories).catch(() => setCategories([]));
    apiFetch<Governorate[]>('/api/governorates').then(setGovernorates).catch(() => setGovernorates([]));
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (methodFilter !== 'all') params.set('purchaseMethod', methodFilter);
      if (governorateFilter !== 'all') params.set('governorateId', governorateFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetch<OrderListItemDto[]>(`/api/admin/orders${query}`);
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, methodFilter, governorateFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openDetail = (order: OrderListItemDto) => {
    setDetailOrderId(order.id);
    setDetailOpen(true);
  };

  const handleExport = () => {
    if (!orders || orders.length === 0) return;

    const rows = orders.map((order) => ({
      'رقم الطلب': order.orderNumber,
      'اسم الزبون': order.customerName,
      'رقم الهاتف': order.phoneNumber,
      'المحافظة': order.governorateName,
      'المنتج/الباقة': order.productName,
      'طريقة الدفع': PURCHASE_METHOD_LABELS[order.purchaseMethod],
      'المبلغ الكلي': order.totalPriceSnapshot,
      'الدفعة الدورية': order.installmentPaymentAmountSnapshot ?? '',
      'المقدمة': order.downPaymentSnapshot ?? '',
      'الحالة': STATUS_LABELS[order.status],
      'التاريخ': formatDate(order.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `طلبات-قلعة-الضمان-${dateStr}.xlsx`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/orders/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadOrders();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-arabic text-2xl font-bold text-foreground">الطلبات</h1>
        <Button
          variant="outline"
          className="font-arabic gap-2"
          onClick={handleExport}
          disabled={!orders || orders.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" />
          تصدير Excel
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="font-arabic">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-arabic">
                كل الحالات
              </SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="font-arabic">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="font-arabic">
              <SelectValue placeholder="الفئة" />
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

        <div className="w-48">
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="font-arabic">
              <SelectValue placeholder="طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-arabic">
                كل طرق الدفع
              </SelectItem>
              {PURCHASE_METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m} className="font-arabic">
                  {PURCHASE_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
            <SelectTrigger className="font-arabic">
              <SelectValue placeholder="المحافظة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-arabic">
                كل المحافظات
              </SelectItem>
              {governorates.map((g) => (
                <SelectItem key={g.id} value={g.id.toString()} className="font-arabic">
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <Button variant="outline" className="font-arabic gap-2" onClick={loadOrders}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && !error && orders && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-muted-foreground">لا توجد طلبات</p>
        </div>
      )}

      {!loading && !error && orders && orders.length > 0 && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-arabic text-right">رقم الطلب</TableHead>
                <TableHead className="font-arabic text-right">اسم الزبون</TableHead>
                <TableHead className="font-arabic text-right">المنتج/الباقة</TableHead>
                <TableHead className="font-arabic text-right">طريقة الدفع</TableHead>
                <TableHead className="font-arabic text-right">الحالة</TableHead>
                <TableHead className="font-arabic text-right">التاريخ</TableHead>
                <TableHead className="font-arabic text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell className="font-arabic">{order.customerName}</TableCell>
                  <TableCell className="font-arabic">{order.productName}</TableCell>
                  <TableCell className="font-arabic">{PURCHASE_METHOD_LABELS[order.purchaseMethod]}</TableCell>
                  <TableCell>
                    <Badge className={`font-arabic ${STATUS_BADGE_CLASS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(order)} title="تفاصيل">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(order);
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

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        orderId={detailOrderId}
        onChanged={loadOrders}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">تأكيد حذف الطلب</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف الطلب رقم <strong>{deleteTarget?.orderNumber}</strong> نهائياً؟ لا يمكن التراجع عن
              هذا الإجراء.
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
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersPage;
