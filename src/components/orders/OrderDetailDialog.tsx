import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, ApiError, resolveMediaUrl } from '@/lib/api';
import type { OrderDetailDto, OrderStatus } from '@/types/admin';
import { ExternalLink, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { STATUS_BADGE_CLASS, STATUS_LABELS, PURCHASE_METHOD_LABELS } from './orderConstants';

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  onChanged: () => void;
}

const STATUS_OPTIONS: OrderStatus[] = ['Pending', 'ContactedByRep', 'Confirmed', 'Rejected', 'Completed'];

function formatMoney(value: number | null): string {
  return value !== null ? `${value.toLocaleString('en-US')} د.ع` : '—';
}

const OrderDetailDialog = ({ open, onOpenChange, orderId, onChanged }: OrderDetailDialogProps) => {
  const [detail, setDetail] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusValue, setStatusValue] = useState<OrderStatus>('Pending');
  const [notesValue, setNotesValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadDetail = async () => {
    if (orderId === null) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<OrderDetailDto>(`/api/admin/orders/${orderId}`);
      setDetail(data);
      setStatusValue(data.status);
      setNotesValue(data.notes ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && orderId !== null) {
      setSaveError(null);
      setSaveSuccess(false);
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  const handleSaveStatus = async () => {
    if (orderId === null) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await apiFetch<OrderDetailDto>(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status: statusValue, notes: notesValue.trim() || null },
      });
      setDetail(updated);
      setSaveSuccess(true);
      onChanged();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-arabic">
            تفاصيل الطلب {detail ? `#${detail.orderNumber}` : ''}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <p className="font-arabic text-destructive">{error}</p>
            <Button variant="outline" className="font-arabic gap-2" onClick={loadDetail}>
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-5">
            <section className="space-y-1.5">
              <h3 className="font-arabic font-semibold text-foreground">بيانات الزبون</h3>
              <p className="font-arabic text-sm">
                <span className="text-muted-foreground">الاسم: </span>
                {detail.customerName}
              </p>
              <p className="font-arabic text-sm" dir="ltr">
                <span className="font-arabic text-muted-foreground">الهاتف: </span>
                {detail.phoneNumber}
              </p>
              <p className="font-arabic text-sm">
                <span className="text-muted-foreground">المحافظة: </span>
                {detail.governorateName}
              </p>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-arabic font-semibold text-foreground">تفاصيل الطلب</h3>
              {detail.packageId !== null && (
                <p className="font-arabic text-sm">
                  <span className="text-muted-foreground">اسم الباقة: </span>
                  {detail.packageName ?? '—'}
                </p>
              )}
              <p className="font-arabic text-sm">
                <span className="text-muted-foreground">المنتج/الباقة: </span>
                {detail.productName ?? detail.packageName ?? '—'}
              </p>
              {detail.items.length > 0 && (
                <ul className="rounded-md border border-border divide-y divide-border">
                  {detail.items.map((item) => (
                    <li key={item.productId} className="font-arabic text-sm px-3 py-2 flex justify-between">
                      <span>{item.productName}</span>
                      <span className="text-muted-foreground">{formatMoney(item.unitPriceSnapshot)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-arabic text-sm">
                <span className="text-muted-foreground">طريقة الدفع: </span>
                {PURCHASE_METHOD_LABELS[detail.purchaseMethod]}
              </p>
              <p className="font-arabic text-sm">
                <span className="text-muted-foreground">المبلغ الكلي: </span>
                {formatMoney(detail.totalPriceSnapshot)}
              </p>
              {detail.installmentPaymentAmountSnapshot !== null && (
                <p className="font-arabic text-sm">
                  <span className="text-muted-foreground">الدفعة الدورية: </span>
                  {formatMoney(detail.installmentPaymentAmountSnapshot)}
                </p>
              )}
              {detail.downPaymentSnapshot !== null && (
                <p className="font-arabic text-sm">
                  <span className="text-muted-foreground">المقدمة: </span>
                  {formatMoney(detail.downPaymentSnapshot)}
                </p>
              )}
            </section>

            {(detail.shopName || detail.shopAddress || detail.homeAddress || detail.nearestLandmark) && (
              <section className="space-y-1.5">
                <h3 className="font-arabic font-semibold text-foreground">بيانات إضافية</h3>
                {detail.shopName && (
                  <p className="font-arabic text-sm">
                    <span className="text-muted-foreground">اسم المحل: </span>
                    {detail.shopName}
                  </p>
                )}
                {detail.shopAddress && (
                  <p className="font-arabic text-sm">
                    <span className="text-muted-foreground">عنوان المحل: </span>
                    {detail.shopAddress}
                  </p>
                )}
                {detail.homeAddress && (
                  <p className="font-arabic text-sm">
                    <span className="text-muted-foreground">عنوان السكن: </span>
                    {detail.homeAddress}
                  </p>
                )}
                {detail.nearestLandmark && (
                  <p className="font-arabic text-sm">
                    <span className="text-muted-foreground">أقرب نقطة دالة: </span>
                    {detail.nearestLandmark}
                  </p>
                )}
              </section>
            )}

            <section className="flex flex-wrap gap-2">
              {detail.mediaUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-arabic gap-2"
                  onClick={() => window.open(resolveMediaUrl(detail.mediaUrl), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  {detail.mediaType === 'Video' ? 'عرض الفيديو' : 'عرض الصورة'}
                </Button>
              )}
              {detail.gpsLat !== null && detail.gpsLng !== null && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-arabic gap-2"
                  onClick={() =>
                    window.open(`https://www.google.com/maps?q=${detail.gpsLat},${detail.gpsLng}`, '_blank')
                  }
                >
                  <MapPin className="h-4 w-4" />
                  فتح بخرائط Google
                </Button>
              )}
              {detail.contractPdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-arabic gap-2"
                  onClick={() => window.open(resolveMediaUrl(detail.contractPdfUrl), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  عرض العقد
                </Button>
              )}
            </section>

            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="font-arabic font-semibold text-foreground">تحديث الحالة</h3>
              <div className="flex items-center gap-2">
                <Badge className={`font-arabic ${STATUS_BADGE_CLASS[detail.status]}`}>
                  {STATUS_LABELS[detail.status]}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <Label className="font-arabic">الحالة الجديدة</Label>
                <Select value={statusValue} onValueChange={(v) => setStatusValue(v as OrderStatus)}>
                  <SelectTrigger className="font-arabic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="font-arabic">
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-arabic">ملاحظات</Label>
                <Textarea
                  className="font-arabic"
                  rows={2}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                />
              </div>
              {saveError && <p className="text-sm text-destructive font-arabic">{saveError}</p>}
              {saveSuccess && <p className="text-sm text-primary font-arabic">تم حفظ الحالة بنجاح</p>}
              <Button className="font-arabic gap-2" onClick={handleSaveStatus} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="font-arabic" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
