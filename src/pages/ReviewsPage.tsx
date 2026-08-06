import { useCallback, useEffect, useState } from 'react';
import { Check, Trash2, RefreshCw, Star } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import type { ReviewDto } from '@/types/admin';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
      />
    ))}
  </div>
);

const ReviewsPage = () => {
  const [pendingOnly, setPendingOnly] = useState(true);
  const [reviews, setReviews] = useState<ReviewDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approvingId, setApprovingId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ReviewDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = pendingOnly ? '?pending=true' : '';
      const data = await apiFetch<ReviewDto[]>(`/api/admin/reviews${query}`);
      setReviews(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [pendingOnly]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleApprove = async (review: ReviewDto) => {
    setApprovingId(review.id);
    try {
      await apiFetch(`/api/admin/reviews/${review.id}/approve`, { method: 'PUT' });
      loadReviews();
    } catch {
      // تجاهل هنا؛ لو فشلت الموافقة يبقى الرأي كما هو ويمكن للمستخدم المحاولة مجدداً
    } finally {
      setApprovingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/reviews/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadReviews();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="font-arabic text-2xl font-bold text-foreground mb-4">الآراء</h1>

      <label className="mb-4 flex items-center gap-2 text-sm font-arabic w-fit">
        <Checkbox checked={pendingOnly} onCheckedChange={(c) => setPendingOnly(c === true)} />
        غير المعتمدة فقط
      </label>

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
          <Button variant="outline" className="font-arabic gap-2" onClick={loadReviews}>
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && !error && reviews && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-muted-foreground">لا توجد آراء</p>
        </div>
      )}

      {!loading && !error && reviews && reviews.length > 0 && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-arabic text-right">اسم الزبون</TableHead>
                <TableHead className="font-arabic text-right">المنتج</TableHead>
                <TableHead className="font-arabic text-right">التقييم</TableHead>
                <TableHead className="font-arabic text-right">التعليق</TableHead>
                <TableHead className="font-arabic text-right">الحالة</TableHead>
                <TableHead className="font-arabic text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-arabic font-medium">{review.customerName}</TableCell>
                  <TableCell className="font-arabic">{review.productName}</TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} />
                  </TableCell>
                  <TableCell className="font-arabic max-w-xs truncate">{review.comment ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={review.isApproved ? 'default' : 'outline'} className="font-arabic">
                      {review.isApproved ? 'معتمد' : 'بانتظار الموافقة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!review.isApproved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(review)}
                          disabled={approvingId === review.id}
                          title="موافقة"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(review);
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

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف رأي "{deleteTarget?.customerName}"؟ لا يمكن التراجع عن هذا الإجراء.
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

export default ReviewsPage;
