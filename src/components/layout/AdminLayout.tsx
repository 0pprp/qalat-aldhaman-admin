import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Tag,
  Package,
  ShoppingCart,
  Star,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/categories', label: 'الفئات', icon: Tag },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { to: '/reviews', label: 'الآراء', icon: Star },
  { to: '/contracts', label: 'عقود طرق الدفع', icon: FileText },
];

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || '؟';
}

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div dir="rtl" className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-e border-sidebar-border">
        <div className="p-5">
          <h1 className="font-arabic text-lg font-bold leading-tight">لوحة تحكم</h1>
          <p className="font-arabic text-sm text-sidebar-foreground/70">قلعة الضمان</p>
        </div>

        <Separator className="bg-sidebar-border" />

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="font-arabic">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-arabic text-sm font-semibold text-foreground">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials(user?.fullName ?? '')}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout} title="تسجيل الخروج">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
