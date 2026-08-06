import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import AdminLayout from '@/components/layout/AdminLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CategoriesPage from '@/pages/CategoriesPage';
import ProductsPage from '@/pages/ProductsPage';
import OrdersPage from '@/pages/OrdersPage';
import ReviewsPage from '@/pages/ReviewsPage';
import ContractsPage from '@/pages/ContractsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RouteGuard>
                  <AdminLayout />
                </RouteGuard>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="contracts" element={<ContractsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
