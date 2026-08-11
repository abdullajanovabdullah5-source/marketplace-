import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isFirebaseReady } from '../firebase';
import { ShoppingBag, ShoppingCart, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'seller': return 'Продавец';
      default: return 'Покупатель';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/" className="nav-logo">
            <ShoppingBag size={24} color="var(--primary)" />
            <span>Sulhak</span>
          </Link>
          <span style={{
            fontSize: '0.7rem',
            padding: '3px 8px',
            borderRadius: '50px',
            background: isFirebaseReady ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: isFirebaseReady ? '#34D399' : '#FBBF24',
            border: isFirebaseReady ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: '700',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isFirebaseReady ? '#10B981' : '#F59E0B'
            }}></span>
            {isFirebaseReady ? 'Firebase' : 'Local DB'}
          </span>
        </div>

        <div className="nav-menu">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Каталог
          </Link>

          {user && (
            <>
              {/* Common link for Buyers and Sellers to track their orders */}
              {user.role !== 'admin' && (
                <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
                  Мои Заказы
                </Link>
              )}

              {/* Seller specific Dashboard */}
              {user.role === 'seller' && (
                <Link to="/seller" className={`nav-link ${isActive('/seller') ? 'active' : ''}`}>
                  Панель Продавца
                </Link>
              )}

              {/* Admin specific Dashboard */}
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                  Панель Админа
                </Link>
              )}
            </>
          )}
        </div>

        <div className="nav-actions">
          {/* Cart Icon */}
          <Link to="/cart" className="cart-icon-btn">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {/* Authentication State */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>
                  {user.email}
                </span>
                <span className={`role-badge role-${user.role}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-secondary btn-sm"
                title="Выйти"
                style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
