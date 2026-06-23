import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  Trash2, 
  ShieldAlert, 
  CheckCircle,
  Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, updateUserRoleInContext } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all users
      const usersRes = await fetch('/api/users', {
        headers: { 'x-user-uid': user.uid }
      });
      const usersData = usersRes.ok ? await usersRes.json() : [];
      setUsersList(usersData);

      // 2. Fetch all products
      const prodRes = await fetch('/api/products');
      const prodData = prodRes.ok ? await prodRes.json() : [];
      setProductsList(prodData);

      // 3. Fetch all orders
      const ordersRes = await fetch('/api/orders', {
        headers: { 'x-user-uid': user.uid }
      });
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      setOrdersList(ordersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Не удалось загрузить данные администратора.');
    } finally {
      setLoading(false);
    }
  };

  // Change User Role Action
  const handleRoleChange = async (targetUid, newRole) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid
        },
        body: JSON.stringify({ uid: targetUid, role: newRole })
      });

      if (response.ok) {
        setUsersList(usersList.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
        updateUserRoleInContext(targetUid, newRole);
        showToast('Роль пользователя успешно изменена!');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при изменении роли.');
      }
    } catch (err) {
      console.error('Role update error:', err);
      alert('Сетевая ошибка при обновлении роли.');
    }
  };

  // Delete Product Action (Moderation)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар как модератор?')) return;

    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: { 'x-user-uid': user.uid }
      });

      if (response.ok) {
        setProductsList(productsList.filter(p => p.id !== productId));
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

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'seller': return 'Продавец';
      default: return 'Покупатель';
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
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={36} color="var(--primary)" />
          <span>Панель Администратора</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Модерация товаров, управление ролями пользователей и статистика.</p>
      </header>

      {loading ? (
        <Loader message="Загрузка панели управления..." />
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#FCA5A5' }}>
          <ShieldAlert style={{ marginBottom: '12px' }} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          {/* Stats Summary Cards */}
          <div className="dashboard-stats animate-fadeInUp">
            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: '#3B82F6', background: 'rgba(59, 130, 246, 0.15)' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="stat-value">{usersList.length}</div>
                <div className="stat-label">Пользователей</div>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon">
                <Package size={24} />
              </div>
              <div>
                <div className="stat-value">{productsList.length}</div>
                <div className="stat-label">Товаров в каталоге</div>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-icon" style={{ color: 'var(--secondary)', background: 'rgba(217, 70, 239, 0.15)' }}>
                <ShoppingBag size={24} />
              </div>
              <div>
                <div className="stat-value">{ordersList.length}</div>
                <div className="stat-label">Заказов оформлено</div>
              </div>
            </div>
          </div>

          {/* User Management Section */}
          <div className="glass-panel animate-fadeInUp" style={{ padding: '24px', animationDelay: '0.1s' }}>
            <h2>Управление пользователями</h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Email</th>
                    <th>Текущая роль</th>
                    <th>Изменить роль</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.uid}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {usr.uid}
                      </td>
                      <td style={{ fontWeight: '500', color: '#fff' }}>{usr.email}</td>
                      <td>
                        <span className={`role-badge role-${usr.role}`}>
                          {getRoleLabel(usr.role)}
                        </span>
                      </td>
                      <td>
                        <select
                          value={usr.role}
                          onChange={(e) => handleRoleChange(usr.uid, e.target.value)}
                          disabled={usr.uid === user.uid} // Can't edit own role
                          style={{
                            background: 'var(--bg-deep)',
                            border: '1px solid var(--border-glass)',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            outline: 'none',
                            fontSize: '0.85rem',
                            cursor: usr.uid === user.uid ? 'not-allowed' : 'pointer',
                            opacity: usr.uid === user.uid ? 0.5 : 1
                          }}
                        >
                          <option value="buyer">Покупатель</option>
                          <option value="seller">Продавец</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Moderation Section */}
          <div className="glass-panel animate-fadeInUp" style={{ padding: '24px', animationDelay: '0.2s' }}>
            <h2>Модерация каталога товаров</h2>
            {productsList.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                В каталоге пока нет ни одного товара.
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
                      <th>Продавец</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsList.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <img 
                            src={product.image} 
                            alt={product.title} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td style={{ fontWeight: '500', color: '#fff' }}>{product.title}</td>
                        <td>{product.category || 'Одежда'}</td>
                        <td style={{ fontFamily: 'var(--font-heading)', fontWeight: '600' }}>
                          {product.price.toLocaleString('ru-RU')} ₽
                        </td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {product.sellerName || 'Seller'}
                        </td>
                        <td>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            style={{ padding: '8px 10px' }}
                            title="Удалить товар"
                          >
                            <Trash2 size={14} />
                          </button>
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
    </div>
  );
};

export default AdminDashboard;
