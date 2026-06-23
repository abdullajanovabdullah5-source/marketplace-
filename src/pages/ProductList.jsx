import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import { Search, ShoppingCart, Tag, User } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [toast, setToast] = useState(null);

  const { addToCart } = useCart();

  const categories = ['Все', 'Одежда', 'Электроника', 'Аксессуары', 'Обувь', 'Другое'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setToast(`${product.title} добавлен в корзину!`);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'Все' || 
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast toast-success">
          <ShoppingCart size={18} color="var(--accent)" />
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{toast}</span>
        </div>
      )}

      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '3rem', marginBottom: '8px' }}>
          Премиум Маркетплейс Sulhak
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Эксклюзивные товары от лучших продавцов. Быстрая доставка, безопасная сделка.
        </p>
      </header>

      {/* Search Bar */}
      <div className="search-wrapper" style={{ maxWidth: '600px', margin: '0 auto 40px auto' }}>
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Поиск товаров по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="catalog-layout">
        {/* Sidebar Filters */}
        <aside className="filter-sidebar glass-panel">
          <h3 className="filter-title">Категории</h3>
          <div className="filter-group">
            {categories.map((cat) => (
              <div
                key={cat}
                className={`filter-item ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ fontWeight: selectedCategory === cat ? '700' : '500' }}
              >
                <Tag size={16} style={{ opacity: selectedCategory === cat ? 1 : 0.6 }} />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main>
          {loading ? (
            <Loader message="Загрузка каталога товаров..." />
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '20px' }}>
                Товары не найдены.
              </p>
              {(search || selectedCategory !== 'Все') && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('Все');
                  }}
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card glass-panel">
                  <div className="product-image-container">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="product-image"
                      loading="lazy"
                    />
                    <span className="product-category">{product.category}</span>
                  </div>

                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-seller">
                      Продавец: {product.sellerName || 'Sulhak Seller'}
                    </p>
                    <p className="product-description">{product.description}</p>

                    <div className="product-footer">
                      <div className="product-price">
                        {product.price.toLocaleString('ru-RU')}
                        <span>₽</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAddToCart(product)}
                        style={{ padding: '10px' }}
                        title="Добавить в корзину"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductList;
