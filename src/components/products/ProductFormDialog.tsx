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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, ApiError, resolveMediaUrl, uploadFile } from '@/lib/api';
import type { CategoryDto, ProductDto, ProductImageDto, ProductUpsertRequest } from '@/types/admin';
import { Loader2, Upload, X } from 'lucide-react';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductDto | null;
  categories: CategoryDto[];
  onSaved: () => void;
}

interface FormState {
  categoryId: number | null;
  name: string;
  description: string;
  cashPrice: string;
  monthlyTotalPrice: string;
  monthlyPaymentAmount: string;
  monthlyDownPayment: string;
  rafidainTotalPrice: string;
  rafidainPaymentAmount: string;
  rafidainDownPayment: string;
  dailyTotalPrice: string;
  dailyPaymentAmount: string;
  sku: string;
  isActive: boolean;
}

function toFormState(product: ProductDto | null): FormState {
  if (!product) {
    return {
      categoryId: null,
      name: '',
      description: '',
      cashPrice: '',
      monthlyTotalPrice: '',
      monthlyPaymentAmount: '',
      monthlyDownPayment: '',
      rafidainTotalPrice: '',
      rafidainPaymentAmount: '',
      rafidainDownPayment: '',
      dailyTotalPrice: '',
      dailyPaymentAmount: '',
      sku: '',
      isActive: true,
    };
  }
  const n = (v: number | null) => v?.toString() ?? '';
  return {
    categoryId: product.categoryId,
    name: product.name,
    description: product.description ?? '',
    cashPrice: n(product.cashPrice),
    monthlyTotalPrice: n(product.monthlyTotalPrice),
    monthlyPaymentAmount: n(product.monthlyPaymentAmount),
    monthlyDownPayment: n(product.monthlyDownPayment),
    rafidainTotalPrice: n(product.rafidainTotalPrice),
    rafidainPaymentAmount: n(product.rafidainPaymentAmount),
    rafidainDownPayment: n(product.rafidainDownPayment),
    dailyTotalPrice: n(product.dailyTotalPrice),
    dailyPaymentAmount: n(product.dailyPaymentAmount),
    sku: product.sku ?? '',
    isActive: product.isActive,
  };
}

function pairError(totalStr: string, paymentStr: string, label: string): string | null {
  const hasTotal = totalStr.trim() !== '';
  const hasPayment = paymentStr.trim() !== '';
  if (hasTotal !== hasPayment) {
    return `يجب تعبئة كلا الحقلين (الكلي والدفعة) لـ${label}`;
  }
  return null;
}

const ProductFormDialog = ({ open, onOpenChange, product, categories, onSaved }: ProductFormDialogProps) => {
  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [savedProduct, setSavedProduct] = useState<ProductDto | null>(product);
  const [nameError, setNameError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find((c) => c.id === form.categoryId) ?? null;
  const images: ProductImageDto[] = savedProduct?.images ?? [];

  useEffect(() => {
    if (open) {
      setForm(toFormState(product));
      setSavedProduct(product);
      setNameError(null);
      setCategoryError(null);
      setPriceError(null);
      setSubmitError(null);
      setImageError(null);
    }
  }, [open, product]);

  const handleCategoryChange = (value: string) => {
    const categoryId = Number(value);
    const category = categories.find((c) => c.id === categoryId) ?? null;
    setForm((prev) => ({
      ...prev,
      categoryId,
      cashPrice: category?.allowsCash ? prev.cashPrice : '',
      monthlyTotalPrice: category?.allowsMonthlyInstallment ? prev.monthlyTotalPrice : '',
      monthlyPaymentAmount: category?.allowsMonthlyInstallment ? prev.monthlyPaymentAmount : '',
      monthlyDownPayment: category?.allowsMonthlyInstallment ? prev.monthlyDownPayment : '',
      rafidainTotalPrice: category?.allowsMonthlyRafidain ? prev.rafidainTotalPrice : '',
      rafidainPaymentAmount: category?.allowsMonthlyRafidain ? prev.rafidainPaymentAmount : '',
      rafidainDownPayment: category?.allowsMonthlyRafidain ? prev.rafidainDownPayment : '',
      dailyTotalPrice: category?.allowsDailyInstallment ? prev.dailyTotalPrice : '',
      dailyPaymentAmount: category?.allowsDailyInstallment ? prev.dailyPaymentAmount : '',
    }));
    setCategoryError(null);
  };

  const num = (s: string): number | null => (s.trim() === '' ? null : Number(s));

  const handleSubmit = async () => {
    let hasError = false;

    if (!form.name.trim()) {
      setNameError('اسم الموديل مطلوب');
      hasError = true;
    } else {
      setNameError(null);
    }

    if (form.categoryId === null) {
      setCategoryError('الفئة مطلوبة');
      hasError = true;
    } else {
      setCategoryError(null);
    }

    const errors = [
      pairError(form.monthlyTotalPrice, form.monthlyPaymentAmount, 'القسط الشهري'),
      pairError(form.rafidainTotalPrice, form.rafidainPaymentAmount, 'قسط الرافدين'),
      pairError(form.dailyTotalPrice, form.dailyPaymentAmount, 'التقسيط اليومي'),
    ].filter((e): e is string => e !== null);

    if (errors.length > 0) {
      setPriceError(errors.join(' — '));
      hasError = true;
    } else {
      setPriceError(null);
    }

    if (hasError || form.categoryId === null) return;

    const payload: ProductUpsertRequest = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      cashPrice: selectedCategory?.allowsCash ? num(form.cashPrice) : null,
      monthlyTotalPrice: selectedCategory?.allowsMonthlyInstallment ? num(form.monthlyTotalPrice) : null,
      monthlyPaymentAmount: selectedCategory?.allowsMonthlyInstallment ? num(form.monthlyPaymentAmount) : null,
      monthlyDownPayment: selectedCategory?.allowsMonthlyInstallment ? num(form.monthlyDownPayment) : null,
      rafidainTotalPrice: selectedCategory?.allowsMonthlyRafidain ? num(form.rafidainTotalPrice) : null,
      rafidainPaymentAmount: selectedCategory?.allowsMonthlyRafidain ? num(form.rafidainPaymentAmount) : null,
      rafidainDownPayment: selectedCategory?.allowsMonthlyRafidain ? num(form.rafidainDownPayment) : null,
      dailyTotalPrice: selectedCategory?.allowsDailyInstallment ? num(form.dailyTotalPrice) : null,
      dailyPaymentAmount: selectedCategory?.allowsDailyInstallment ? num(form.dailyPaymentAmount) : null,
      sku: form.sku.trim() || null,
      isActive: form.isActive,
    };

    setSaving(true);
    setSubmitError(null);
    try {
      const result = savedProduct
        ? await apiFetch<ProductDto>(`/api/admin/products/${savedProduct.id}`, { method: 'PUT', body: payload })
        : await apiFetch<ProductDto>('/api/admin/products', { method: 'POST', body: payload });
      setSavedProduct(result);
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !savedProduct) return;
    setUploadingImage(true);
    setImageError(null);
    try {
      const uploaded = await uploadFile(file, 'products');
      const image = await apiFetch<ProductImageDto>(`/api/admin/products/${savedProduct.id}/images`, {
        method: 'POST',
        body: { imageUrl: uploaded.url, displayOrder: images.length },
      });
      setSavedProduct((prev) => (prev ? { ...prev, images: [...prev.images, image] } : prev));
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : 'فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageDelete = async (imageId: number) => {
    if (!savedProduct) return;
    setImageError(null);
    try {
      await apiFetch(`/api/admin/products/${savedProduct.id}/images/${imageId}`, { method: 'DELETE' });
      setSavedProduct((prev) => (prev ? { ...prev, images: prev.images.filter((i) => i.id !== imageId) } : prev));
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : 'فشل حذف الصورة');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-arabic">{savedProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-arabic">
              الفئة <span className="text-destructive">*</span>
            </Label>
            <Select value={form.categoryId?.toString() ?? ''} onValueChange={handleCategoryChange}>
              <SelectTrigger className="font-arabic">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()} className="font-arabic">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryError && <p className="text-sm text-destructive font-arabic">{categoryError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="prod-name">
              اسم الموديل <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prod-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="font-arabic"
            />
            {nameError && <p className="text-sm text-destructive font-arabic">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="prod-desc">
              الوصف
            </Label>
            <Textarea
              id="prod-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="font-arabic"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-arabic" htmlFor="prod-sku">
              SKU
            </Label>
            <Input id="prod-sku" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <Label className="font-arabic">نقد</Label>
            <Input
              type="number"
              placeholder="السعر النقدي"
              disabled={!selectedCategory?.allowsCash}
              value={form.cashPrice}
              onChange={(e) => setForm((p) => ({ ...p, cashPrice: e.target.value }))}
            />
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <Label className="font-arabic">شهري عادي</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="المبلغ الكلي"
                disabled={!selectedCategory?.allowsMonthlyInstallment}
                value={form.monthlyTotalPrice}
                onChange={(e) => setForm((p) => ({ ...p, monthlyTotalPrice: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="الدفعة الشهرية"
                disabled={!selectedCategory?.allowsMonthlyInstallment}
                value={form.monthlyPaymentAmount}
                onChange={(e) => setForm((p) => ({ ...p, monthlyPaymentAmount: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="المقدمة (اختياري)"
                disabled={!selectedCategory?.allowsMonthlyInstallment}
                value={form.monthlyDownPayment}
                onChange={(e) => setForm((p) => ({ ...p, monthlyDownPayment: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <Label className="font-arabic">شهري رافدين</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="المبلغ الكلي"
                disabled={!selectedCategory?.allowsMonthlyRafidain}
                value={form.rafidainTotalPrice}
                onChange={(e) => setForm((p) => ({ ...p, rafidainTotalPrice: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="الدفعة الشهرية"
                disabled={!selectedCategory?.allowsMonthlyRafidain}
                value={form.rafidainPaymentAmount}
                onChange={(e) => setForm((p) => ({ ...p, rafidainPaymentAmount: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="المقدمة (اختياري)"
                disabled={!selectedCategory?.allowsMonthlyRafidain}
                value={form.rafidainDownPayment}
                onChange={(e) => setForm((p) => ({ ...p, rafidainDownPayment: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <Label className="font-arabic">يومي</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="المبلغ الكلي"
                disabled={!selectedCategory?.allowsDailyInstallment}
                value={form.dailyTotalPrice}
                onChange={(e) => setForm((p) => ({ ...p, dailyTotalPrice: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="الدفعة اليومية"
                disabled={!selectedCategory?.allowsDailyInstallment}
                value={form.dailyPaymentAmount}
                onChange={(e) => setForm((p) => ({ ...p, dailyPaymentAmount: e.target.value }))}
              />
            </div>
          </div>

          {priceError && <p className="text-sm text-destructive font-arabic">{priceError}</p>}

          <label className="flex items-center gap-2 text-sm font-arabic">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(c) => setForm((p) => ({ ...p, isActive: c === true }))}
            />
            فعّال
          </label>

          {submitError && <p className="text-sm text-destructive font-arabic">{submitError}</p>}

          <div className="space-y-2 border-t border-border pt-4">
            <Label className="font-arabic">الصور</Label>
            {!savedProduct && <p className="text-sm text-muted-foreground font-arabic">احفظ المنتج أولاً</p>}
            {savedProduct && (
              <>
                <div className="flex flex-wrap gap-2">
                  {images.map((img) => (
                    <div key={img.id} className="relative h-16 w-16">
                      <img
                        src={resolveMediaUrl(img.imageUrl)}
                        alt=""
                        className="h-16 w-16 rounded-md border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(img.id)}
                        className="absolute -top-1.5 -end-1.5 rounded-full bg-destructive text-destructive-foreground p-0.5"
                        title="حذف الصورة"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="font-arabic gap-2"
                >
                  {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  إضافة صورة
                </Button>
                {imageError && <p className="text-sm text-destructive font-arabic">{imageError}</p>}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="font-arabic" onClick={() => onOpenChange(false)}>
            إغلاق
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

export default ProductFormDialog;
