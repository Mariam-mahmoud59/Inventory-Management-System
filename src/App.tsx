import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from '@/components/layout/Layout';

// Lazy load route pages for automatic code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })));

const ProductsPage = lazy(() => import('@/pages/ProductsPage').then(module => ({ default: module.ProductsPage })));
const StockPage = lazy(() => import('@/pages/StockPage').then(module => ({ default: module.StockPage })));
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then(module => ({ default: module.OrdersPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then(module => ({ default: module.UsersPage })));
const BranchesPage = lazy(() => import('@/pages/BranchesPage').then(module => ({ default: module.BranchesPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(module => ({ default: module.ReportsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// React Router v6 Data BrowserRouter setup
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div className="flex p-8 justify-center items-center"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'products',
        element: <ProductsPage />,
      },
      {
        path: 'stock',
        element: <StockPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'branches',
        element: <BranchesPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: '*',
        element: (
          <Suspense fallback={null}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
