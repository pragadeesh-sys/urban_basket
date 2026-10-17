import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, CheckCircle, Package } from 'lucide-react';
import { cartApi, orderApi } from '../api/endpoints';
import { scenes } from '../assets/scenes';
import { PageBanner } from '../components/PageBanner';

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface CartData {
  id: number;
  items: CartItem[];
  totalAmount: number;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCart = async () => {
    try {
      const res = await cartApi.get();
      setCart(res.data as CartData);
      window.dispatchEvent(new Event('cart-changed'));
    } catch {
      setCart({ id: 0, items: [], totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQty = async (itemId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(itemId);
      return;
    }
    try {
      await cartApi.updateItem(itemId, qty);
      fetchCart();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || 'Failed to update quantity.');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      fetchCart();
    } catch {
      alert('Failed to remove item.');
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items.length) return;
    if (!deliveryAddress.trim() || !contactPhone.trim()) {
      alert('Enter a delivery address and contact phone.');
      return;
    }
    setCheckoutLoading(true);
    try {
      await orderApi.create({
        deliveryAddress: deliveryAddress.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim() || undefined,
      });
      setOrderSuccess(true);
      setCart({ id: 0, items: [], totalAmount: 0 });
      window.dispatchEvent(new Event('cart-changed'));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Checkout failed. Please try again.';
      alert(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', gap: '1.5rem' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,217,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={40} color="var(--secondary)" />
        </div>
        <h2 style={{ color: 'var(--text-primary)' }}>Order Placed Successfully!</h2>
        <p>Your order has been confirmed and is being processed.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/orders" className="btn btn-primary">View Orders</Link>
          <Link to="/products" className="btn btn-ghost">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  return (
    <div>
      <PageBanner image={scenes.cart}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-subtitle">
            {loading ? 'Loading your cart…' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        <Link to="/products" className="btn btn-ghost btn-sm">
          <Package size={14} /> Continue shopping
        </Link>
      </div>
      </PageBanner>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><ShoppingCart size={28} /></div>
          <h3>Your cart is empty</h3>
          <p>Add products from the catalog, then come back here to check out.</p>
          <Link to="/products" className="btn btn-primary btn-sm">Browse products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Items</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div className="catalog-icon"><Package size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatCurrency(item.unitPrice)} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => updateQty(item.id, item.quantity - 1)} title="Decrease">
                      <Minus size={12} />
                    </button>
                    <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => updateQty(item.id, item.quantity + 1)} title="Increase">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-light)', minWidth: 72, textAlign: 'right' }}>
                    {formatCurrency(item.subtotal)}
                  </div>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(item.id)} title="Remove">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ position: 'sticky', top: '1rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <ShoppingCart size={18} style={{ display: 'inline', marginRight: 6 }} />
                Checkout
              </h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.375rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                {formatCurrency(cart?.totalAmount ?? 0)}
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Delivery address *</label>
              <input className="form-control" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Street, city, PIN" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact phone *</label>
              <input className="form-control" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="10-digit mobile" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional delivery note" />
            </div>
            <button
              id="checkout-btn"
              className="btn btn-primary w-full btn-lg"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Processing…' : (<><CreditCard size={16} /> Place Order</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
