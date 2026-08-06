const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const GENERIC_ERROR_MESSAGE = 'حدث خطأ غير متوقع، حاول مرة أخرى';
const NETWORK_ERROR_MESSAGE = 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت وحاول مرة أخرى';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function extractErrorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message?: unknown };
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return GENERIC_ERROR_MESSAGE;
}

// يُضبط من AuthContext عند تسجيل الدخول/الخروج — apiFetch دالة مستقلة (لا Hook) فتُستخدم
// خارج مكوّنات React أيضاً، فلا يمكنها قراءة الـ Context مباشرة.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// يُستدعى عند أي رد 401 من الباك اند (توكن منتهي/مرفوض) — AuthContext يسجّله لينهي الجلسة تلقائياً.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

/**
 * Wrapper حول fetch لكل طلبات باك اند لوحة التحكم. يضيف توكن الجلسة تلقائياً، ويحوّل أخطاء
 * الشبكة والاستجابات غير الناجحة لرسالة عربية واضحة (رسالة الباك اند نفسها عند توفرها).
 */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data), response.status);
  }

  return data as T;
}

/**
 * الروابط القادمة من الباك اند (صور، ملفات PDF) نسبية (مثلاً /uploads/products/x.png)
 * وتحتاج ربطها بأصل الـ API.
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

/**
 * رفع ملف عبر POST /api/uploads?folder=. لا يمر عبر apiFetch لأن FormData يحتاج
 * المتصفح يضبط Content-Type (بحدود multipart) بنفسه.
 */
export async function uploadFile(file: File, folder: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/uploads?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: formData,
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data), response.status);
  }

  return data as { url: string };
}
