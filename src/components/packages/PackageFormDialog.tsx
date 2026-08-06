import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { apiFetch, ApiError } from '@/lib/api';
import type { PackageDto, PackageUpsertRequest } from '@/types/admin';
import { Loader2 } from 'lucide-react';

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number;
  pkg: PackageDto | null;
  onSaved: () => void;
}

interface FormState {
  name: string;
  minimumTotalPrice: string;
  displayOrder: string;
  isActive: boolean;
}

function toFormState(pkg: PackageDto | null): FormState {
  if (!pkg) {
    return { name: '', minimumTotalPrice: '', displayOrder: '0', isActive: true };
  }
  return {
    name: pkg.name,
    minimumTotalPrice: pkg.minimumTotalPrice.toString(),
    displayOrder: pkg.displayOrder.toString(),
    isActive: pkg.isActive,
  };
}

const PackageFormDialog = ({ open, onOpenChange, categoryId, pkg, onSaved }: PackageFormDialogProps) => {
  const [form, setForm] = useState<FormState>(() => toFormState(pkg));
  const [nameError, setNameError] = useState<string | null>(null);
  const [minError, setMinError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = pkg !== null;

  useEffect(() => {
    if (open) {
      setForm(toFormState(pkg));
      setNameError(null);
      setMinError(null);
      setSubmitError(null);
    }
  }, [open, pkg]);

  const handleSubmit = async () => {
    let hasError = false;

    if (!form.name.trim()) {
      setNameError('الاسم مطلوب');
      hasError = true;
    } else {
      setNameError(null);
    }

    const minValue = Number(form.minimumTotalPrice);
    if (!form.minimumTotalPrice.trim() || Number.isNaN(minValue) || minValue <= 0) {
      setMinError('الحد الأدنى يجب أن يكون رقماً أكبر من صفر');
      hasError = true;
    } else {
      setMinError(null);
    }

    if (hasError) return;

    // الحقول التسعة لأسعار الباقة لا تظهر بهذه النافذة المبسّطة، لكنها موجودة بالكيان —
    // نُعيد إرسالها كما هي من الباقة الأصلية لتفادي تصفيرها بالخطأ عند أي تعديل هنا.
    const payload: PackageUpsertRequest = {
      categoryId,
      name: form.name.trim(),
      minimumTotalPrice: minValue,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
      cashPrice: pkg?.cashPrice ?? null,
      monthlyTotalPrice: pkg?.monthlyTotalPrice ?? null,
      monthlyPaymentAmount: pkg?.monthlyPaymentAmount ?? null,
      monthlyDownPayment: pkg?.monthlyDownPayment ?? null,
      rafidainTotalPrice: pkg?.rafidainTotalPrice ?? null,
      rafidainPaymentAmount: pkg?.rafidainPaymentAmount ?? null,
      rafidainDownPayment: pkg?.rafidainDownPayment ?? null,
      dailyTotalPrice: pkg?.dailyTotalPrice ?? null,
      dailyPaymentAmount: pkg?.dailyPaymentAmount ?? null,
    };

    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit) {
        await apiFetch(`/api/admin/packages/${pkg!.id}`, { method: 'PUT', body: payload });
      } else {
        await apiFetch('/api/admin/packages', { method: 'POST', body: payload });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-arabic">{isEdit ? 'تعديل باقة' : 'إضافة باقة جديدة'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="pkg-name">
              الاسم <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="font-arabic"
            />
            {nameError && <p className="text-sm text-destructive font-arabic">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="pkg-min">
              الحد الأدنى <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-min"
              type="number"
              value={form.minimumTotalPrice}
              onChange={(e) => setForm((p) => ({ ...p, minimumTotalPrice: e.target.value }))}
            />
            {minError && <p className="text-sm text-destructive font-arabic">{minError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="pkg-order">
              ترتيب العرض
            </Label>
            <Input
              id="pkg-order"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-arabic">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(c) => setForm((p) => ({ ...p, isActive: c === true }))}
            />
            فعّال
          </label>

          {submitError && <p className="text-sm text-destructive font-arabic">{submitError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" className="font-arabic" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button className="font-arabic gap-2" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PackageFormDialog;
