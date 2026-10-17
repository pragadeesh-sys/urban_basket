import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, LogOut, Search, ShoppingCart, UserRound } from 'lucide-react';
import { cartApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function StoreHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [count, setCount] = useState(0);

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  useEffect(() => {
    let active = true;
    const load = () => {
      cartApi.get()
        .then((res) => {
          if (!active) return;
          const items = (res.data?.items ?? []) as { quantity?: number }[];
          setCount(items.reduce((sum, item) => sum + (item.quantity ?? 0), 0));
        })
        .catch(() => {
          if (active) setCount(0);
        });
    };
    load();
    window.addEventListener('cart-changed', load);
    return () => {
      active = false;
      window.removeEventListener('cart-changed', load);
    };
  }, []);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = query.trim();
    if (value) next.set('q', value);
    else next.delete('q');
    navigate({ pathname: '/products', search: next.toString() });
  };

  return (
    <header className="store-header">
      <Link to="/products" className="store-brand">
        <span className="store-brand-mark"><Leaf size={18} /></span>
        <span>
          <strong>UrbanBasket</strong>
          <small>Organic market</small>
        </span>
      </Link>

      <form className="store-search" onSubmit={search}>
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for product, brand or category"
          aria-label="Search products"
        />
      </form>

      <nav className="store-nav">
        <NavLink to="/products" end>Home</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/returns">Returns</NavLink>
        <NavLink to="/cart" className="store-cart">
          <ShoppingCart size={18} />
          <span>Cart</span>
          {count > 0 && <em>{count}</em>}
        </NavLink>
        <NavLink to="/profile" className="store-account" title={user?.fullName}>
          <UserRound size={18} />
          <span>{user?.fullName?.split(' ')[0] || 'Account'}</span>
        </NavLink>
        <ThemeToggle />
        <button
          type="button"
          className="store-logout"
          title="Logout"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <LogOut size={16} />
        </button>
      </nav>
    </header>
  );
}
