import {
  Apple,
  Check,
  Coffee,
  Fish,
  Home,
  Leaf,
  Milk,
  Package,
  Plus,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Truck,
} from 'lucide-react';
import { scenes } from '../assets/scenes';

export interface ShopProduct {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  minimumStockLevel: number;
  imageUrl?: string;
}

const TILES: { name: string; icon: typeof Leaf }[] = [
  { name: 'Fruits & Vegetables', icon: Apple },
  { name: 'Dairy & Bakery', icon: Milk },
  { name: 'Beverages & Snacks', icon: Coffee },
  { name: 'Staples & Household', icon: Home },
  { name: 'Meat & Seafood', icon: Fish },
  { name: 'Frozen Foods', icon: Snowflake },
  { name: 'Personal Care', icon: Sparkles },
  { name: 'Other', icon: Package },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function artFor(category: string) {
  if (category.includes('Fruit') || category.includes('Veg')) return scenes.products;
  if (category.includes('Dairy')) return scenes.cart;
  if (category.includes('Beverage')) return scenes.hero;
  if (category.includes('Personal')) return scenes.profile;
  if (category.includes('Frozen')) return scenes.orders;
  if (category.includes('Meat')) return scenes.returns;
  if (category.includes('Staple') || category.includes('Household')) return scenes.dashboard;
  return scenes.suppliers;
}

export function ShopHome({
  products,
  loading,
  category,
  onCategory,
  onAdd,
  addingId,
  addedId,
}: {
  products: ShopProduct[];
  loading: boolean;
  category: string;
  onCategory: (category: string) => void;
  onAdd: (id: number) => void;
  addingId: number | null;
  addedId: number | null;
}) {
  return (
    <div className="shop-home">
      <section className="shop-hero-row">
        <article className="shop-hero">
          <div className="shop-hero-copy">
            <p className="shop-kicker">All natural products</p>
            <h1>Fresh and Healthy Veggies Organic Market</h1>
            <p>Groceries from the produce aisle, packed for the way you shop at home.</p>
            <button type="button" className="shop-cta" onClick={() => {
              onCategory('All');
              document.getElementById('shop-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              Shop now
            </button>
          </div>
          <img src={scenes.products} alt="Fresh vegetables and fruit" />
        </article>

        <aside className="shop-rail">
          <article className="shop-promo">
            <img src={scenes.cart} alt="" />
            <div>
              <p className="shop-kicker">Everyday basket</p>
              <h2>Fill the basket with this week’s fresh picks</h2>
            </div>
          </article>
          <div className="shop-trust">
            <div><Truck size={16} /><span>Home delivery</span></div>
            <div><Leaf size={16} /><span>Fresh stock</span></div>
            <div><ShieldCheck size={16} /><span>Easy returns</span></div>
          </div>
          <div className="shop-spotlights">
            <button type="button" className="shop-spot veg" onClick={() => onCategory('Fruits & Vegetables')}>
              <strong>Healthy vegetables</strong>
              <span>Shop produce</span>
            </button>
            <button type="button" className="shop-spot snack" onClick={() => onCategory('Beverages & Snacks')}>
              <strong>Crunchy snacks</strong>
              <span>Shop snacks</span>
            </button>
          </div>
        </aside>
      </section>

      <section className="shop-tiles" aria-label="Categories">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          const active = category === tile.name;
          return (
            <button
              key={tile.name}
              type="button"
              className={active ? 'active' : ''}
              onClick={() => onCategory(active ? 'All' : tile.name)}
            >
              <span><Icon size={18} /></span>
              {tile.name}
            </button>
          );
        })}
      </section>

      <section id="shop-grid" className="shop-section">
        <div className="shop-section-head">
          <h2>{category === 'All' ? 'Top picks today' : category}</h2>
          {category !== 'All' && (
            <button type="button" onClick={() => onCategory('All')}>View all</button>
          )}
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <h3>No products found</h3>
            <p>Try another category or a different search.</p>
          </div>
        ) : (
          <div className="shop-grid">
            {products.map((product) => {
              const out = product.stockQuantity === 0;
              const added = addedId === product.id;
              return (
                <article key={product.id} className="shop-card">
                  <div className="shop-photo">
                    <img
                      src={product.imageUrl || artFor(product.category)}
                      alt=""
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.dataset.fallback === '1') return;
                        img.dataset.fallback = '1';
                        img.src = artFor(product.category);
                      }}
                    />
                    <span className={out ? 'off' : ''}>
                      {out ? 'Out of stock' : product.stockQuantity <= product.minimumStockLevel ? 'Low stock' : 'Fresh'}
                    </span>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.category}</p>
                  <div className="shop-card-foot">
                    <strong>{formatCurrency(product.sellingPrice)}</strong>
                    <button
                      type="button"
                      disabled={out || addingId === product.id}
                      onClick={() => onAdd(product.id)}
                      aria-label={out ? 'Out of stock' : `Add ${product.name}`}
                    >
                      {added ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
