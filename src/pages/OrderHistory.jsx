import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { 
  ClipboardList, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/orders', {
        headers: { 'x-user-uid': user.uid }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Не удалось загрузить историю заказов.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Сетевая ошибка при загрузке заказов.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Доставлен',
          color: 'var(--accent)',
          icon: <CheckCircle size={18} />
        };
      case 'shipped':
        return {
          label: 'Отправлен',
          color: '#60A5FA',
          icon: <Truck size={18} />
        };
      default:
        return {
          label: 'В обработке',
          color: '#FBBF24',
          icon: <Clock size={18} />
        };
    }
  };

  return (
    <div className="app-container">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={36} color="var(--primary)" />
          <span>{user && user.role === 'seller' ? 'Продажи' : 'Мои Заказы'}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {user && user.role === 'seller' 
            ? 'История продаж и отправлений ваших товаров.' 
            : 'История ваших покупок и статус доставки.'}
        </p>
      </header>

      {loading ? (
        <Loader message="Загрузка списка заказов..." />
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#FCA5A5' }}>
          <AlertCircle style={{ marginBottom: '12px' }} />
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel animate-fadeInUp" style={{ padding: '60px', textAlign: 'center' }}>
          <HelpCircle size={48} color="var(--text-dim)" style={{ marginBottom: '20px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem' }}>
            {user && user.role === 'seller' 
              ? 'У вас еще нет продаж.' 
              : 'Вы еще не оформили ни одного заказа.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map((order) => {
            const statusInfo = getStatusDetails(order.status);
            const formattedDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={order.id} 
                className="glass-panel animate-fadeInUp" 
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                {/* Order Top Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border-glass)',
                  paddingBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Заказ <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{order.id}</span>
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      Оформлен {formattedDate}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: statusInfo.color,
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '6px 14px',
                    borderRadius: '50px',
                    border: `1px solid ${statusInfo.color}33`
                  }}>
                    {statusInfo.icon}
                    <span>{statusInfo.label}</span>
                  </div>
                </div>

                {/* Items Bought List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{item.title}</h4>
                        {user.role === 'buyer' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            Продавец: {item.sellerName || 'Sulhak'}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '8px' }}>
                          x{item.quantity}
                        </span>
                        <strong style={{ fontSize: '1rem', color: '#fff' }}>
                          {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer summary */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(8, 11, 17, 0.4)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '10px'
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    {user.role === 'seller' ? 'Сумма продаж:' : 'Итоговая стоимость:'}
                  </span>
                  <strong style={{ fontSize: '1.3rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                    {order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString('ru-RU')} ₽
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
