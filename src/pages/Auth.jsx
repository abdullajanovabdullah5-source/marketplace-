import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isFirebaseReady } from '../firebase';
import { Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer'); // 'buyer' or 'seller'
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Пожалуйста, заполните все поля.');
      return;
    }

    setSubmitting(true);
    let success = false;

    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(email, password, role);
    }

    setSubmitting(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="app-container">
      <div className="auth-wrapper glass-panel animate-fadeInUp">
        <div className="auth-header">
          <h2>{isLogin ? 'С возвращением' : 'Создать аккаунт'}</h2>
          <p className="auth-toggle-text">
            {isLogin ? 'Впервые на Sulhak?' : 'Уже есть аккаунт?'}
            <span 
              className="auth-toggle-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setLocalError('');
              }}
            >
              {isLogin ? 'Регистрация' : 'Войти'}
            </span>
          </p>
        </div>

        {(error || localError) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FCA5A5',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                className="input-field"
                placeholder="example@sulhak.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: isLogin ? '32px' : '24px' }}>
            <label className="form-label">Пароль</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </div>

          {/* Role selector (only during registration) */}
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label className="form-label">Кто вы?</label>
              <div className="role-selector">
                <div 
                  className={`role-option ${role === 'buyer' ? 'selected' : ''}`}
                  onClick={() => setRole('buyer')}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Покупатель</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Хочу покупать товары
                  </div>
                </div>
                <div 
                  className={`role-option ${role === 'seller' ? 'selected' : ''}`}
                  onClick={() => setRole('seller')}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Продавец</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Хочу продавать товары
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', gap: '10px' }}
            disabled={submitting}
          >
            {submitting ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                Войти в личный кабинет
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Создать аккаунт
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {isFirebaseReady ? (
            <p style={{ fontSize: '0.75rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <strong>Firebase подключен!</strong> Вы можете зарегистрировать новый аккаунт с реальной базой данных или использовать существующие демо-аккаунты (если они созданы в вашей БД Firestore).
            </p>
          ) : (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <p style={{ fontSize: '0.75rem', color: '#FBBF24', marginBottom: '8px', fontWeight: '600' }}>
                Firebase не настроен (Локальный демо-режим)
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Используйте демо-аккаунты для входа:<br />
                <strong>seller@sulhak.com</strong> (Продавец) / <strong>admin@sulhak.com</strong> (Админ)<br />
                Пароль: <strong>password</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
