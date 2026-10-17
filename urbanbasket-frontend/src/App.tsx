import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { CartPage } from './pages/CartPage';
import { AttendancePage } from './pages/AttendancePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminAccountsPage } from './pages/AdminAccountsPage';
import { ProfilePage } from './pages/ProfilePage';

function HomeRedirect() {
  const { user } = useAuth();
  const destination = user?.role === 'CUSTOMER' ? '/products' : user?.role === 'SUPPLIER' ? '/purchases' : '/dashboard';
  return <Navigate to={destination} replace />;
}

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['ADMIN', 'STAFF', 'ACCOUNTANT']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/returns" element={<ReturnsPage />} />

            {/* Customer only */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute roles={['CUSTOMER']}>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            {/* Admin + Staff + Accountant */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute roles={['ADMIN', 'STAFF', 'ACCOUNTANT']}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />

            {/* Admin + Accountant */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}>
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute roles={['ADMIN', 'ACCOUNTANT']}>
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <ProtectedRoute roles={['ADMIN', 'STAFF', 'ACCOUNTANT', 'SUPPLIER']}>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/admin/accounts"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminAccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['ADMIN', 'CUSTOMER']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<HomeRedirect />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
