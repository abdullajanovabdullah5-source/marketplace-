import React from 'react';

const Loader = ({ message = 'Загрузка...' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{message}</p>
    </div>
  );
};

export default Loader;
