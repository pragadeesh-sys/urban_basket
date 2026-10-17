import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Undo2,
  Users,
  CalendarCheck,
  TrendingUp,
  Receipt,
  Truck,
  ShoppingBag,
  LogOut,
  Store,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const { user, logout, isAdmin, isAccountant, isCustomer, isStaff, isSupplier } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Store size={22} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">UrbanBasket</span>
          <span className="sidebar-logo-subtitle">Smart Supermarket</span>
        </div>
      </div>

      <div className="sidebar-theme">
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-title">Main</span>

        {!isCustomer() && !isSupplier() && (
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} className="nav-item-icon" />
            Dashboard
          </NavLink>
        )}

        {!isSupplier() && (
          <NavLink to="/products" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Package size={18} className="nav-item-icon" />
            Products
          </NavLink>
        )}

        {isCustomer() && (
          <NavLink to="/cart" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <ShoppingCart size={18} className="nav-item-icon" />
            My Cart
          </NavLink>
        )}

        {isStaff() && (
          <NavLink to="/purchases" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <ShoppingBag size={18} className="nav-item-icon" />
            Purchases
          </NavLink>
        )}

        {isSupplier() && (
          <NavLink to="/purchases" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <ShoppingBag size={18} className="nav-item-icon" />
            Requests
          </NavLink>
        )}

        {!isSupplier() && (
          <NavLink to="/orders" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <ClipboardList size={18} className="nav-item-icon" />
            Orders
          </NavLink>
        )}

        {!isSupplier() && (
          <NavLink to="/returns" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Undo2 size={18} className="nav-item-icon" />
            Returns
          </NavLink>
        )}

        {isCustomer() && (
          <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <UserCog size={18} className="nav-item-icon" />
            My Profile
          </NavLink>
        )}

        {(isAdmin() || isAccountant()) && (
          <>
            <span className="sidebar-section-title">Finance</span>

            <NavLink to="/analytics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <TrendingUp size={18} className="nav-item-icon" />
              Analytics
            </NavLink>

            <NavLink to="/expenses" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Receipt size={18} className="nav-item-icon" />
              Expenses
            </NavLink>

            <NavLink to="/suppliers" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Truck size={18} className="nav-item-icon" />
              Suppliers
            </NavLink>

            <NavLink to="/purchases" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <ShoppingBag size={18} className="nav-item-icon" />
              Purchases
            </NavLink>
          </>
        )}

        {!isCustomer() && !isSupplier() && (
          <>
            <span className="sidebar-section-title">HR</span>
            <NavLink to="/attendance" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <CalendarCheck size={18} className="nav-item-icon" />
              Attendance
            </NavLink>
          </>
        )}

        {isAdmin() && (
          <>
            <span className="sidebar-section-title">Administration</span>
            <NavLink to="/admin/accounts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Users size={18} className="nav-item-icon" />
              Accounts
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <UserCog size={18} className="nav-item-icon" />
              My Profile
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer User Card */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.fullName}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px',
              transition: 'color 0.15s',
            }}
            title="Logout"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
