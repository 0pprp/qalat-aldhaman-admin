import { useEffect, useRef, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiFetch, ApiError, resolveMediaUrl, uploadFile } from '@/lib/api';
import type { CategoryDto, CategoryUpsertRequest } from '@/types/admin';
import { Loader2, Upload } from 'lucide-react';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDto | null;
  onSaved: () => void;
}

interface FormState {
  name: string;
  description: string;
  imageUrl: string;
  allowsCash: boolean;
  allowsMonthlyInstallment: boolean;
  allowsMonthlyRafidain: boolean;
  allowsDailyInstallment: boolean;
  requiresShopOwner: boolean;
  minInvoiceCash: string;
  minInvoiceInstallment: string;
  hasCustomProductField: boolean;
  usesPackages: boolean;
  displayOrder: string;
  isActive: boolean;
}

function toFormState(category: CategoryDto | null): FormState {
  if (!category) {
    return {
      name: '',
      description: '',
      imageUrl: '',
      allowsCash: true,
      allowsMonthlyInstallment: false,
      allowsMonthlyRafidain: false,
      allowsDailyInstallment: false,
      requiresShopOwner: false,
      minInvoiceCash: '',
      minInvoiceInstallment: '',
      hasCustomProductField: false,
      usesPackages: false,
      displayOrder: '0',
      isActive: true,
    };
  }
  return {
    name: category.name,
    description: category.description ?? '',
    imageUrl: category.imageUrl ?? '',
    allowsCash: category.allowsCash,
    allowsMonthlyInstallment: category.allowsMonthlyInstallment,
    allowsMonthlyRafidain: category.allowsMonthlyRafidain,
    allowsDailyInstallment: category.allowsDailyInstallment,
    requiresShopOwner: category.requiresShopOwner,
    minInvoiceCash: category.minInvoiceCash?.toString() ?? '',
    minInvoiceInstallment: category.minInvoiceInstallment?.toString() ?? '',
    hasCustomProductField: category.hasCustomProductField,
    usesPackages: category.usesPackages,
    displayOrder: category.displayOrder.toString(),
    isActive: category.isActive,
  };
}

const CategoryFormDialog = ({ open, onOpenChange, category, onSaved }: CategoryFormDialogProps) => {
  const [form, setForm] = useState<FormState>(() => toFormState(category));
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = category !== null;
  const showInstallmentMin = form.allowsMonthlyInstallment || form.allowsMonthlyRafidain || form.allowsDailyInstallment;

  useEffect(() => {
    if (open) {
      setForm(toFormState(category));
      setNameError(null);
      setSubmitError(null);
    }
  }, [open, category]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSubmitError(null);
    try {
      const result = await uploadFile(file, 'categories');
      setForm((prev) => ({ ...prev, imageUrl: result.url }));
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setNameError('الاسم مطلوب');
      return;
    }
    setNameError(null);
    setSubmitError(null);

    const payload: CategoryUpsertRequest = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl || null,
      allowsCash: form.allowsCash,
      allowsMonthlyInstallment: form.allowsMonthlyInstallment,
      allowsMonthlyRafidain: form.allowsMonthlyRafidain,
      allowsDailyInstallment: form.allowsDailyInstallment,
      requiresShopOwner: form.requiresShopOwner,
      minInvoiceCash: form.allowsCash && form.minInvoiceCash.trim() !== '' ? Number(form.minInvoiceCash) : null,
      minInvoiceInstallment:
        showInstallmentMin && form.minInvoiceInstallment.trim() !== '' ? Number(form.minInvoiceInstallment) : null,
      hasCustomProductField: form.hasCustomProductField,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
      usesPackages: form.usesPackages,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/admin/categories/${category!.id}`, { method: 'PUT', body: payload });
      } else {
        await apiFetch('/api/admin/categories', { method: 'POST', body: payload });
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
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-arabic">{isEdit ? 'تعديل فئة' : 'إضافة فئة جديدة'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="cat-name">
              الاسم <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="font-arabic"
            />
            {nameError && <p className="text-sm text-destructive font-arabic">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="cat-desc">
              الوصف
            </Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="font-arabic"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic">الصورة</Label>
            <div className="flex items-center gap-3">
              {form.imageUrl && (
                <img
                  src={resolveMediaUrl(form.imageUrl)}
                  alt=""
                  className="h-14 w-14 rounded-md border border-border object-cover"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="font-arabic gap-2"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.imageUrl ? 'تغيير الصورة' : 'رفع صورة'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-arabic">طرق الدفع المقبولة</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm font-arabic">
                <Checkbox
                  checked={form.allowsCash}
                  onCheckedChange={(c) => setForm((p) => ({ ...p, allowsCash: c === true }))}
                />
                نقد
              </label>
              <label className="flex items-center gap-2 text-sm font-arabic">
                <Checkbox
                  checked={form.allowsMonthlyInstallment}
                  onCheckedChange={(c) => setForm((p) => ({ ...p, allowsMonthlyInstallment: c === true }))}
                />
                شهري عادي
              </label>
              <label className="flex items-center gap-2 text-sm font-arabic">
                <Checkbox
                  checked={form.allowsMonthlyRafidain}
                  onCheckedChange={(c) => setForm((p) => ({ ...p, allowsMonthlyRafidain: c === true }))}
                />
                شهري رافدين
              </label>
              <label className="flex items-center gap-2 text-sm font-arabic">
                <Checkbox
                  checked={form.allowsDailyInstallment}
                  onCheckedChange={(c) => setForm((p) => ({ ...p, allowsDailyInstallment: c === true }))}
                />
                يومي
              </label>
            </div>
          </div>

          {form.allowsCash && (
            <div className="space-y-1.5">
              <Label className="font-arabic" htmlFor="cat-min-cash">
                حد أدنى للنقد
              </Label>
              <Input
                id="cat-min-cash"
                type="number"
                value={form.minInvoiceCash}
                onChange={(e) => setForm((p) => ({ ...p, minInvoiceCash: e.target.value }))}
              />
            </div>
          )}

          {showInstallmentMin && (
            <div className="space-y-1.5">
              <Label className="font-arabic" htmlFor="cat-min-installment">
                حد أدنى للقسط
              </Label>
              <Input
                id="cat-min-installment"
                type="number"
                value={form.minInvoiceInstallment}
                onChange={(e) => setForm((p) => ({ ...p, minInvoiceInstallment: e.target.value }))}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-arabic">
            <Checkbox
              checked={form.requiresShopOwner}
              onCheckedChange={(c) => setForm((p) => ({ ...p, requiresShopOwner: c === true }))}
            />
            يشترط صاحب محل
          </label>

          <label className="flex items-center gap-2 text-sm font-arabic">
            <Checkbox
              checked={form.hasCustomProductField}
              onCheckedChange={(c) => setForm((p) => ({ ...p, hasCustomProductField: c === true }))}
            />
            يحتوي حقل منتج مخصص (لفئة أخرى)
          </label>

          <label className="flex items-center gap-2 text-sm font-arabic">
            <Checkbox
              checked={form.usesPackages}
              onCheckedChange={(c) => setForm((p) => ({ ...p, usesPackages: c === true }))}
            />
            يستخدم نظام الباقات
          </label>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="cat-order">
              ترتيب العرض
            </Label>
            <Input
              id="cat-order"
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

export default CategoryFormDialog;
