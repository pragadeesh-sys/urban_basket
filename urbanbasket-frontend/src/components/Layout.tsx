import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { StoreHeader } from './StoreHeader';

export function Layout() {
  const { isCustomer } = useAuth();

  if (isCustomer()) {
    return (
      <div className="store-app">
        <div className="store-sheet">
          <StoreHeader />
          <div className="store-body animate-fade">
            <Outlet />
          </div>
          <footer className="store-footer">
            <div>
              <strong>UrbanBasket</strong>
              <p>Fresh groceries, delivered from the store.</p>
            </div>
            <nav>
              <Link to="/products">Shop</Link>
              <Link to="/orders">Orders</Link>
              <Link to="/returns">Returns</Link>
              <Link to="/profile">Account</Link>
            </nav>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-content animate-fade">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
