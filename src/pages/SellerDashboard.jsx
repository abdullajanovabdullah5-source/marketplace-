import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { 
  Package, 
  TrendingUp, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Truck,
  CheckCircle,
  Clock
} from 'lucide-react';

const SellerDashboard = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    image: '',
    category: 'Одежда'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch seller products
      const prodRes = await fetch(`/api/products?sellerId=${user.uid}`);
      const prodData = prodRes.ok ? await prodRes.json() : [];
      setProducts(prodData);

      // 2. Fetch seller orders
      const orderRes = await fetch('/api/orders', {
        headers: { 'x-user-uid': user.uid }
      });
      const orderData = orderRes.ok ? await orderRes.json() : [];
      setOrders(orderData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Не удалось загрузить данные дашборда.');
    } finally {
      setLoading(false);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-uid': user.uid }
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
        showToast('Товар успешно удален.');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при удалении товара.');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Сетевая ошибка при удалении товара.');
    }
  };

  // Open modal for Adding new product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      image: '',
      category: 'Одежда'
    });
    setIsModalOpen(true);
  };

  // Open modal for Editing existing product
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category || 'Одежда'
    });
    setIsModalOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    
    const payload = {
      ...formData,
      price: Number(formData.price),
      sellerId: user.uid,
      sellerName: user.email.split('@')[0]
    };

    try {
      let response;
      if (editingProduct) {
        // Edit product PUT
        response = await fetch('/api/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-uid': user.uid
          },
          body: JSON.stringify({ id: editingProduct.id, ...payload })
        });
      } else {
        // Create product POST
        response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-uid': user.uid
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const savedProduct = await response.json();
        if (editingProduct) {
          setProducts(products.map(p => p.id === editingProduct.id ? savedProduct : p));
          showToast('Товар успешно обновлен!');
        } else {
          setProducts([savedProduct, ...products]);
          showToast('Товар успешно добавлен!');
        }
        setIsModalOpen(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при сохранении товара.');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Сетевая ошибка при сохранении товара.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Order status update action
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid
        },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });

      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        showToast('Статус заказа обновлен!');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка обновления статуса.');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Сетевая ошибка при изменении статуса.');
    }
  };

  // Helpers for stats
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, order) => {
      // Sum only products of this seller
      const sellerSum = order.items
        .filter(item => item.sellerId === user.uid)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return acc + sellerSum;
    }, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: '600' }}><CheckCircle size={14} /> Доставлен</span>;
      case 'shipped':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#60A5FA', fontSize: '0.85rem', fontWeight: '600' }}><Truck size={14} /> Отправлен</span>;
      default:
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FBBF24', fontSize: '0.85rem', fontWeight: '600' }}><Clock size={14} /> В обработке</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast toast-success">
          <CheckCircle size={18} color="var(--accent)" />
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{toast}</span>
        </div>
      )}

      <header style={{ marginBottom: '40px' }}>
        <h1 className="page-title">Панель Продавца</h1>
        <p style={{ color: 'var(--text-muted)' }}>Управляйте своими товарами и продажами в Sulhak.</p>
      </header>

      {loading ? (
        <Loader message="Загрузка данных дашборда..." />
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#FCA5A5' }}>
          <AlertCircle style={{ marginBottom: '12px' }} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Stats Section */}
          <div className="dashboard-stats animate-fadeInUp">
            <div className="stat-card glass-panel">
              <div className="stat-icon">
                <Package size={24} />
              </div>
              <div>
                <div className="stat-value">{products.length}</div>
                <div className="stat-label">Активные товары</div>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(217, 70, 239, 0.15)' }}>
                <ShoppingBag size={24} />
              </div>
              <div>
                <div className="stat-value">{orders.length}</div>
                <div className="stat-label">Получено заказов</div>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: 'var(--accent)', background: 'rgba(16, 185, 129, 0.15)' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="stat-value">{totalRevenue.toLocaleString('ru-RU')} ₽</div>
                <div className="stat-label">Выручка (доставленные)</div>
              </div>
            </div>
          </div>

          {/* Products Management Panel */}
          <div className="glass-panel animate-fadeInUp" style={{ padding: '24px', animationDelay: '0.1s' }}>
            <div className="panel-title-actions">
              <h2>Мои Товары</h2>
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={18} />
                Добавить товар
              </button>
            </div>

            {products.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Вы еще не добавили ни одного товара. Нажмите кнопку выше, чтобы начать.
              </p>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Изображение</th>
                      <th>Название</th>
                      <th>Категория</th>
                      <th>Цена</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <img 
                            src={product.image} 
                            alt={product.title} 
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td style={{ fontWeight: '600', color: '#fff' }}>{product.title}</td>
                        <td>{product.category || 'Одежда'}</td>
                        <td style={{ fontFamily: 'var(--font-heading)', fontWeight: '600' }}>
                          {product.price.toLocaleString('ru-RU')} ₽
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEditModal(product)}
                              style={{ padding: '8px 10px' }}
                              title="Редактировать"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              style={{ padding: '8px 10px' }}
                              title="Удалить"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Orders Management Panel */}
          <div className="glass-panel animate-fadeInUp" style={{ padding: '24px', animationDelay: '0.2s' }}>
            <h2>Заказы Клиентов</h2>
            
            {orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Покупатели еще не оформляли заказы на ваши товары.
              </p>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Заказа</th>
                      <th>Клиент</th>
                      <th>Товары</th>
                      <th>Сумма заказа</th>
                      <th>Статус</th>
                      <th>Изменить статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.id}</td>
                        <td style={{ fontSize: '0.9rem' }}>{order.buyerEmail}</td>
                        <td>
                          {order.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              • {item.title} <strong style={{ color: '#fff' }}>x{item.quantity}</strong>
                            </div>
                          ))}
                        </td>
                        <td style={{ fontFamily: 'var(--font-heading)', fontWeight: '600' }}>
                          {order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('ru-RU')} ₽
                        </td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            style={{
                              background: 'var(--bg-deep)',
                              border: '1px solid var(--border-glass)',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              outline: 'none',
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">В обработке</option>
                            <option value="shipped">Отправлен</option>
                            <option value="delivered">Доставлен</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Название товара</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Введите название"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание товара</label>
            <textarea 
              className="input-field" 
              placeholder="Введите подробное описание"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ resize: 'none', height: '80px' }}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Цена (₽)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="24900"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Категория</label>
              <select 
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                <option value="Одежда">Одежда</option>
                <option value="Электроника">Электроника</option>
                <option value="Аксессуары">Аксессуары</option>
                <option value="Обувь">Обувь</option>
                <option value="Другое">Другое</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Ссылка на изображение</label>
            <input 
              type="url" 
              className="input-field" 
              placeholder="https://images.unsplash.com/... (URL)"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={formSubmitting}
          >
            {formSubmitting ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : (
              editingProduct ? 'Сохранить изменения' : 'Добавить товар'
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SellerDashboard;
