import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingBag, Plus, Minus, CreditCard, CheckCircle } from 'lucide-react';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (user.role !== 'buyer') {
      setError('Оформление заказов доступно только для покупателей.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': user.uid
        },
        body: JSON.stringify({
          items: cartItems,
          total: cartTotal,
          buyerEmail: user.email
        })
      });

      if (response.ok) {
        setOrderSuccess(true);
        clearCart();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Не удалось оформить заказ. Попробуйте еще раз.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Сетевая ошибка при оформлении заказа.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="app-container">
        <div className="glass-panel animate-fadeInUp" style={{ maxWidth: '600px', margin: '60px auto', padding: '40px', textAlign: 'center' }}>
          <CheckCircle size={64} color="var(--accent)" style={{ marginBottom: '24px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Заказ успешно оформлен!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.05rem' }}>
            Ваш заказ принят в обработку. Продавец свяжется с вами в ближайшее время для уточнения деталей.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/orders" className="btn btn-primary">
              Мои заказы
            </Link>
            <Link to="/" className="btn btn-secondary">
              В каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="page-title">Корзина</h1>

      {cartItems.length === 0 ? (
        <div className="glass-panel animate-fadeInUp" style={{ padding: '60px', textAlign: 'center' }}>
          <ShoppingBag size={48} color="var(--text-dim)" style={{ marginBottom: '20px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '24px' }}>
            Ваша корзина пока пуста.
          </p>
          <Link to="/" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Cart Items List */}
          <div className="cart-items-panel glass-panel animate-fadeInUp">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.title} className="cart-item-img" />
                
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.title}</h3>
                  <span className="cart-item-seller">Продавец: {item.sellerName || 'Sulhak'}</span>
                  <div className="cart-item-price" style={{ marginTop: '8px' }}>
                    {item.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="cart-item-quantity">
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '600' }}>
                    {item.quantity}
                  </span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Delete Button */}
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => removeFromCart(item.id)}
                  style={{ padding: '10px' }}
                  title="Удалить товар"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary-panel glass-panel animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Детали заказа</h3>
            
            <div className="summary-row">
              <span>Количество товаров</span>
              <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)} шт.</span>
            </div>
            
            <div className="summary-row">
              <span>Доставка</span>
              <span style={{ color: 'var(--accent)' }}>Бесплатно</span>
            </div>

            {error && (
              <div style={{
                color: '#FCA5A5',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <div className="summary-row total">
              <span>Итого</span>
              <span>{cartTotal.toLocaleString('ru-RU')} ₽</span>
            </div>

            {user ? (
              user.role === 'buyer' ? (
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '16px', gap: '10px' }}
                  onClick={handleCheckout}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Оформить заказ
                    </>
                  )}
                </button>
              ) : (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '16px', textAlign: 'center' }}>
                  Вы вошли как {user.role === 'seller' ? 'продавец' : 'администратор'}. Заказы могут оформлять только покупатели.
                </p>
              )
            ) : (
              <Link 
                to="/auth" 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '16px', textDecoration: 'none' }}
              >
                Войти для оформления заказа
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
