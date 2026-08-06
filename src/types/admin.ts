// يطابق ردود QalatAldhaman.Store.Api/DTOs/Admin بالضبط (camelCase تلقائي من System.Text.Json).

export type PurchaseMethod = 'Cash' | 'MonthlyInstallment' | 'MonthlyRafidain' | 'DailyInstallment';
export type MediaType = 'Photo' | 'Video';
export type OrderStatus = 'Pending' | 'ContactedByRep' | 'Confirmed' | 'Rejected' | 'Completed';

// --- Auth ---

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  username: string;
  fullName: string;
}

// --- Categories ---

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  allowsCash: boolean;
  allowsMonthlyInstallment: boolean;
  allowsMonthlyRafidain: boolean;
  allowsDailyInstallment: boolean;
  requiresShopOwner: boolean;
  minInvoiceCash: number | null;
  minInvoiceInstallment: number | null;
  hasCustomProductField: boolean;
  displayOrder: number;
  isActive: boolean;
  usesPackages: boolean;
}

export interface CategoryUpsertRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  allowsCash: boolean;
  allowsMonthlyInstallment: boolean;
  allowsMonthlyRafidain: boolean;
  allowsDailyInstallment: boolean;
  requiresShopOwner: boolean;
  minInvoiceCash?: number | null;
  minInvoiceInstallment?: number | null;
  hasCustomProductField: boolean;
  displayOrder: number;
  isActive: boolean;
  usesPackages: boolean;
}

// --- Products ---

export interface ProductImageDto {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

export interface ProductDto {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  cashPrice: number | null;
  monthlyTotalPrice: number | null;
  monthlyPaymentAmount: number | null;
  monthlyDownPayment: number | null;
  rafidainTotalPrice: number | null;
  rafidainPaymentAmount: number | null;
  rafidainDownPayment: number | null;
  dailyTotalPrice: number | null;
  dailyPaymentAmount: number | null;
  sku: string | null;
  isActive: boolean;
  isAvailableInPackages: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImageDto[];
}

export interface ProductUpsertRequest {
  categoryId: number;
  name: string;
  description?: string | null;
  cashPrice?: number | null;
  monthlyTotalPrice?: number | null;
  monthlyPaymentAmount?: number | null;
  monthlyDownPayment?: number | null;
  rafidainTotalPrice?: number | null;
  rafidainPaymentAmount?: number | null;
  rafidainDownPayment?: number | null;
  dailyTotalPrice?: number | null;
  dailyPaymentAmount?: number | null;
  sku?: string | null;
  isActive: boolean;
  isAvailableInPackages: boolean;
}

export interface AddProductImageRequest {
  imageUrl: string;
  displayOrder: number;
}

// --- Packages ---

export interface PackageDto {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  minimumTotalPrice: number;
  displayOrder: number;
  isActive: boolean;
  cashPrice: number | null;
  monthlyTotalPrice: number | null;
  monthlyPaymentAmount: number | null;
  monthlyDownPayment: number | null;
  rafidainTotalPrice: number | null;
  rafidainPaymentAmount: number | null;
  rafidainDownPayment: number | null;
  dailyTotalPrice: number | null;
  dailyPaymentAmount: number | null;
}

export interface PackageUpsertRequest {
  categoryId: number;
  name: string;
  minimumTotalPrice: number;
  displayOrder: number;
  isActive: boolean;
  cashPrice?: number | null;
  monthlyTotalPrice?: number | null;
  monthlyPaymentAmount?: number | null;
  monthlyDownPayment?: number | null;
  rafidainTotalPrice?: number | null;
  rafidainPaymentAmount?: number | null;
  rafidainDownPayment?: number | null;
  dailyTotalPrice?: number | null;
  dailyPaymentAmount?: number | null;
}

// --- Orders ---

export interface OrderListItemDto {
  id: number;
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  productName: string;
  categoryName: string;
  governorateId: number;
  governorateName: string;
  purchaseMethod: PurchaseMethod;
  status: OrderStatus;
  totalPriceSnapshot: number;
  installmentPaymentAmountSnapshot: number | null;
  downPaymentSnapshot: number | null;
  createdAt: string;
}

export interface OrderItemDto {
  productId: number;
  productName: string;
  unitPriceSnapshot: number;
  unitPeriodicPaymentSnapshot: number | null;
  unitDownPaymentSnapshot: number | null;
  quantity: number;
}

export interface OrderDetailDto {
  id: number;
  orderNumber: string;
  productId: number | null;
  productName: string | null;
  packageId: number | null;
  packageName: string | null;
  categoryId: number;
  categoryName: string;
  purchaseMethod: PurchaseMethod;
  customerName: string;
  phoneNumber: string;
  governorateId: number;
  governorateName: string;
  shopName: string | null;
  shopAddress: string | null;
  homeAddress: string | null;
  nearestLandmark: string | null;
  mediaUrl: string | null;
  mediaType: MediaType | null;
  gpsLat: number | null;
  gpsLng: number | null;
  customProductDescription: string | null;
  totalPriceSnapshot: number;
  installmentPaymentAmountSnapshot: number | null;
  downPaymentSnapshot: number | null;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  contractPdfUrl: string | null;
  items: OrderItemDto[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string | null;
}

// --- Reviews ---

export interface ReviewDto {
  id: number;
  productId: number;
  productName: string;
  customerName: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
}

// --- Purchase method contracts ---

export interface PurchaseMethodContractDto {
  purchaseMethod: PurchaseMethod;
  contractPdfUrl: string | null;
  updatedAt: string;
}

export interface UpdateContractRequest {
  contractPdfUrl: string;
}

// --- Dashboard ---

export interface CategoryOrderCountDto {
  categoryName: string;
  orderCount: number;
}

export interface RecentOrderDto {
  id: number;
  orderNumber: string;
  customerName: string;
  productName: string;
  purchaseMethod: PurchaseMethod;
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardStatsDto {
  ordersByStatus: Record<string, number>;
  totalOrders: number;
  ordersLast7Days: number;
  ordersLast30Days: number;
  ordersByCategory: CategoryOrderCountDto[];
  ordersByPurchaseMethod: Record<string, number>;
  estimatedConfirmedRevenue: number;
  recentOrders: RecentOrderDto[];
  pendingReviewsCount: number;
  activeProductsCount: number;
  activeCategoriesCount: number;
}

// --- Shared ---

export interface Governorate {
  id: number;
  name: string;
}
