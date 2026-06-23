import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
        <Link to="/" className="nav-logo">
          <ShoppingBag size={24} color="var(--primary)" />
          <span>Sulhak</span>
        </Link>

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
