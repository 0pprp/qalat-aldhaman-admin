import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Star, Tag, Package as PackageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { apiFetch, ApiError } from '@/lib/api';
import { formatIQD } from '@/lib/utils';
import type { DashboardStatsDto, OrderStatus, PurchaseMethod } from '@/types/admin';
import { STATUS_LABELS, STATUS_BADGE_CLASS, PURCHASE_METHOD_LABELS } from '@/components/orders/orderConstants';
import OrderDetailDialog from '@/components/orders/OrderDetailDialog';

const STATUS_ORDER: OrderStatus[] = ['Pending', 'ContactedByRep', 'Confirmed', 'Rejected', 'Completed'];
const METHOD_ORDER: PurchaseMethod[] = ['Cash', 'MonthlyInstallment', 'MonthlyRafidain', 'DailyInstallment'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DashboardStatsDto>('/api/admin/dashboard/stats');
      setStats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const openOrderDetail = (orderId: number) => {
    setDetailOrderId(orderId);
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-arabic text-2xl font-bold text-foreground">الرئيسية</h1>
        <Button variant="outline" className="font-arabic gap-2" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {!loading && error && !stats && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-destructive">{error}</p>
          <Button variant="outline" className="font-arabic gap-2" onClick={loadStats}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-arabic text-sm text-muted-foreground">إجمالي الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-arabic text-sm text-muted-foreground">آخر 7 أيام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.ordersLast7Days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-arabic text-sm text-muted-foreground">آخر 30 يوم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.ordersLast30Days}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-arabic text-sm text-muted-foreground">الإيراد التقديري المؤكد</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{formatIQD(stats.estimatedConfirmedRevenue)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingReviewsCount}</p>
                  <p className="font-arabic text-sm text-muted-foreground">آراء بانتظار الموافقة</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <PackageIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeProductsCount}</p>
                  <p className="font-arabic text-sm text-muted-foreground">منتجات فعّالة</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Tag className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeCategoriesCount}</p>
                  <p className="font-arabic text-sm text-muted-foreground">فئات فعّالة</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-arabic text-base">توزيع الحالات</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {STATUS_ORDER.map((s) => (
                <Badge key={s} className={`font-arabic gap-1.5 ${STATUS_BADGE_CLASS[s]}`}>
                  {STATUS_LABELS[s]}: {stats.ordersByStatus[s] ?? 0}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-arabic text-base">توزيع حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {stats.ordersByCategory.length === 0 && (
                  <p className="font-arabic text-sm text-muted-foreground">لا توجد بيانات</p>
                )}
                {stats.ordersByCategory.map((c) => (
                  <div key={c.categoryName} className="flex justify-between font-arabic text-sm">
                    <span>{c.categoryName}</span>
                    <span className="text-muted-foreground">{c.orderCount}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-arabic text-base">توزيع حسب طريقة الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {METHOD_ORDER.map((m) => (
                  <div key={m} className="flex justify-between font-arabic text-sm">
                    <span>{PURCHASE_METHOD_LABELS[m]}</span>
                    <span className="text-muted-foreground">{stats.ordersByPurchaseMethod[m] ?? 0}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-arabic text-base">آخر 10 طلبات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentOrders.length === 0 ? (
                <p className="font-arabic text-sm text-muted-foreground p-4">لا توجد طلبات</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-arabic text-right">رقم الطلب</TableHead>
                        <TableHead className="font-arabic text-right">الزبون</TableHead>
                        <TableHead className="font-arabic text-right">المنتج</TableHead>
                        <TableHead className="font-arabic text-right">طريقة الدفع</TableHead>
                        <TableHead className="font-arabic text-right">الحالة</TableHead>
                        <TableHead className="font-arabic text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer"
                          onClick={() => openOrderDetail(order.id)}
                        >
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <OrderDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        orderId={detailOrderId}
        onChanged={loadStats}
      />
    </div>
  );
};

export default DashboardPage;
