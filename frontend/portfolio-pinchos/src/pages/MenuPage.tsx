import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TOAST_SLUG = import.meta.env.VITE_TOAST_RESTAURANT_SLUG || 'pinchos-lounge';

const categories = ['KABOBS', 'WRAPS', 'FRIES', 'DRINKS', 'SPECIALS'];

interface MenuItem {
  name: string;
  price: string;
  description: string;
  image: string;
  tag?: string;
}

const menuData: Record<string, MenuItem[]> = {
  KABOBS: [
    { name: 'CHICKEN KABOB', price: '$15', description: 'Marinated chicken, red onion, bell peppers, zucchini. Served with rice & garlic sauce.', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80' },
    { name: 'BEEF KABOB', price: '$16', description: 'Tender grilled beef, peppers, onions, zucchini. Served with rice & yogurt sauce.', image: 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80' },
    { name: 'LAMB KABOB', price: '$17', description: 'Juicy lamb, charred veggies, zucchini, bell peppers. Served with warm pita & tzatziki.', image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&q=80' },
    { name: 'VEGGIE SKEWERS', price: '$13', description: 'Grilled mushrooms, zucchini, peppers, onion & cherry tomatoes. Served with rice & hummus.', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80', tag: 'VEGETARIAN' },
    { name: 'LOADED FRIES', price: '$12', description: 'Crispy fries, grilled chicken, garlic sauce, feta, pickled onions.', image: 'https://images.unsplash.com/photo-1630384060421-cb20aebe213c?w=300&q=80' },
    { name: 'KABOB WRAP', price: '$13', description: 'Your choice of protein, pita, lettuce, tomato, pickled onions, garlic sauce.', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&q=80' },
    { name: 'SIGNATURE DRINKS', price: '$6+', description: 'Lemonades, mocktails, cold teas & more.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80' },
  ],
  WRAPS: [
    { name: 'CHICKEN WRAP', price: '$13', description: 'Grilled chicken, lettuce, tomato, pickled onion, garlic sauce in warm pita.', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&q=80' },
    { name: 'BEEF WRAP', price: '$14', description: 'Seasoned beef, fresh veggies, tahini sauce wrapped in lavash.', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&q=80' },
    { name: 'FALAFEL WRAP', price: '$12', description: 'Crispy falafel, hummus, pickles, tomato, lettuce in pita.', image: 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb6?w=300&q=80', tag: 'VEGETARIAN' },
  ],
  FRIES: [
    { name: 'LOADED FRIES', price: '$12', description: 'Crispy fries, grilled chicken, garlic sauce, feta, pickled onions.', image: 'https://images.unsplash.com/photo-1630384060421-cb20aebe213c?w=300&q=80' },
    { name: 'CHEESE FRIES', price: '$9', description: 'Golden fries with melted cheese blend and jalapeños.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80' },
    { name: 'PLAIN FRIES', price: '$6', description: 'Classic crispy golden fries with seasoning.', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80' },
  ],
  DRINKS: [
    { name: 'PINCHOS PUNCH', price: '$8', description: 'Our signature tropical lemonade blend.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80' },
    { name: 'HIBISCUS LEMONADE', price: '$7', description: 'Fresh hibiscus, lemon, cane sugar over ice.', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=80' },
    { name: 'MANGO ICED TEA', price: '$6', description: 'Cold brewed tea with mango and mint.', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80' },
  ],
  SPECIALS: [
    { name: 'FAMILY PLATTER', price: '$45', description: 'Mixed kabobs, rice, hummus, pita, salad. Feeds 3-4.', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80' },
    { name: 'DATE NIGHT COMBO', price: '$35', description: '2 kabob plates, 2 drinks, shared appetizer.', image: 'https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80' },
  ],
};

function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('KABOBS');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const items = menuData[activeCategory] || [];

  const totalItems = Object.values(quantities).reduce((s, v) => s + v, 0);

  const addItem = (name: string) => {
    setQuantities((prev) => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };
  const removeItem = (name: string) => {
    setQuantities((prev) => {
      const val = (prev[name] || 0) - 1;
      if (val <= 0) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: val };
    });
  };

  return (
    <div className="menu-page">
      {/* Header */}
      <header className="menu-header">
        <img src="/images/logo.png" alt="Pinchos Lounge" className="menu-logo" />
        <h1 className="menu-title">Menu</h1>
        <div className="menu-header-icons">
          <button className="menu-icon-btn" aria-label="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <a
            href={`https://order.toasttab.com/${TOAST_SLUG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-cart-btn"
            aria-label="Cart"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && (
              <span className="menu-cart-badge">{totalItems}</span>
            )}
          </a>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="menu-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`menu-tab ${activeCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="menu-items">
        {items.map((item) => {
          const qty = quantities[item.name] || 0;
          return (
            <div key={item.name} className="menu-card">
              <img src={item.image} alt={item.name} className="menu-card-img" />
              <div className="menu-card-body">
                <div className="menu-card-top">
                  <div className="menu-card-info">
                    <h3 className="menu-card-name">{item.name}</h3>
                    <p className="menu-card-desc">{item.description}</p>
                    {item.tag && (
                      <span className="menu-card-tag">&#x1F331; {item.tag}</span>
                    )}
                  </div>
                  <div className="menu-card-right">
                    <span className="menu-card-price">{item.price}</span>
                    {qty > 0 ? (
                      <div className="menu-qty-ctrl">
                        <button onClick={() => removeItem(item.name)} className="menu-qty-btn">&minus;</button>
                        <span className="menu-qty-val">{qty}</span>
                        <button onClick={() => addItem(item.name)} className="menu-qty-btn">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addItem(item.name)} className="menu-add-btn">+ ADD</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Order Button */}
      <div className="menu-order-wrap">
        <a
          href={`https://order.toasttab.com/${TOAST_SLUG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="menu-start-order"
        >
          START ORDER <span className="ml-2">&rsaquo;</span>
        </a>
      </div>
    </div>
  );
}

export default MenuPage;
