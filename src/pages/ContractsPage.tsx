import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Trash2, Upload } from 'lucide-react';
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
import { apiFetch, ApiError, resolveMediaUrl, uploadFile } from '@/lib/api';
import type { PurchaseMethod, PurchaseMethodContractDto } from '@/types/admin';
import { PURCHASE_METHOD_LABELS } from '@/components/orders/orderConstants';

const PURCHASE_METHODS: PurchaseMethod[] = ['Cash', 'MonthlyInstallment', 'MonthlyRafidain', 'DailyInstallment'];

const ContractsPage = () => {
  const [contracts, setContracts] = useState<Record<PurchaseMethod, PurchaseMethodContractDto | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadingMethod, setUploadingMethod] = useState<PurchaseMethod | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [deleteTarget, setDeleteTarget] = useState<PurchaseMethod | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PurchaseMethodContractDto[]>('/api/admin/contracts');
      const map: Record<PurchaseMethod, PurchaseMethodContractDto | null> = {
        Cash: null,
        MonthlyInstallment: null,
        MonthlyRafidain: null,
        DailyInstallment: null,
      };
      data.forEach((c) => {
        map[c.purchaseMethod] = c;
      });
      setContracts(map);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleUpload = async (method: PurchaseMethod, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMethod(method);
    setRowError((prev) => ({ ...prev, [method]: '' }));
    try {
      const uploaded = await uploadFile(file, 'contracts');
      const updated = await apiFetch<PurchaseMethodContractDto>(`/api/admin/contracts/${method}`, {
        method: 'PUT',
        body: { contractPdfUrl: uploaded.url },
      });
      setContracts((prev) => (prev ? { ...prev, [method]: updated } : prev));
    } catch (err) {
      setRowError((prev) => ({
        ...prev,
        [method]: err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع',
      }));
    } finally {
      setUploadingMethod(null);
      const input = fileInputRefs.current[method];
      if (input) input.value = '';
    }
  };

  const handleDeleteFile = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/admin/contracts/${deleteTarget}`, { method: 'DELETE' });
      setContracts((prev) =>
        prev ? { ...prev, [deleteTarget]: prev[deleteTarget] ? { ...prev[deleteTarget]!, contractPdfUrl: null } : null } : prev,
      );
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="font-arabic text-2xl font-bold text-foreground mb-4">عقود طرق الدفع</h1>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-16">
          <p className="font-arabic text-destructive">{error}</p>
          <Button variant="outline" className="font-arabic" onClick={loadContracts}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      {!loading && !error && contracts && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-arabic text-right">طريقة الدفع</TableHead>
                <TableHead className="font-arabic text-right">حالة الملف</TableHead>
                <TableHead className="font-arabic text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PURCHASE_METHODS.map((method) => {
                const contract = contracts[method];
                const hasFile = !!contract?.contractPdfUrl;
                return (
                  <TableRow key={method}>
                    <TableCell className="font-arabic font-medium">{PURCHASE_METHOD_LABELS[method]}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={hasFile ? 'default' : 'outline'} className="font-arabic">
                          {hasFile ? 'يوجد ملف' : 'لا يوجد ملف'}
                        </Badge>
                        {hasFile && (
                          <a
                            href={resolveMediaUrl(contract!.contractPdfUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-arabic"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            فتح الملف
                          </a>
                        )}
                      </div>
                      {rowError[method] && (
                        <p className="text-sm text-destructive font-arabic mt-1">{rowError[method]}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <input
                          ref={(el) => {
                            fileInputRefs.current[method] = el;
                          }}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => handleUpload(method, e)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-arabic gap-2"
                          disabled={uploadingMethod === method}
                          onClick={() => fileInputRefs.current[method]?.click()}
                        >
                          {uploadingMethod === method ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {hasFile ? 'تحديث' : 'رفع'}
                        </Button>
                        {hasFile && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف الملف"
                            onClick={() => {
                              setDeleteTarget(method);
                              setDeleteError(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-arabic">تأكيد حذف الملف</AlertDialogTitle>
            <AlertDialogDescription className="font-arabic">
              هل أنت متأكد من حذف ملف عقد "{deleteTarget ? PURCHASE_METHOD_LABELS[deleteTarget] : ''}"؟
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
                handleDeleteFile();
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

export default ContractsPage;
