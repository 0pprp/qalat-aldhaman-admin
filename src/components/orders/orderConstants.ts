import type { OrderStatus, PurchaseMethod } from '@/types/admin';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  Pending: 'قيد الانتظار',
  ContactedByRep: 'تم التواصل',
  Confirmed: 'مؤكد',
  Rejected: 'مرفوض',
  Completed: 'مكتمل',
};

export const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  Pending: 'bg-yellow-500 text-yellow-950 border-transparent hover:bg-yellow-500',
  ContactedByRep: 'bg-blue-500 text-white border-transparent hover:bg-blue-500',
  Confirmed: 'bg-green-600 text-white border-transparent hover:bg-green-600',
  Rejected: 'bg-red-600 text-white border-transparent hover:bg-red-600',
  Completed: 'bg-gray-500 text-white border-transparent hover:bg-gray-500',
};

export const PURCHASE_METHOD_LABELS: Record<PurchaseMethod, string> = {
  Cash: 'نقد',
  MonthlyInstallment: 'شهري عادي',
  MonthlyRafidain: 'شهري رافدين',
  DailyInstallment: 'يومي',
};
