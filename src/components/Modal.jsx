import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        {title && <h3 style={{ marginBottom: '24px', fontSize: '1.5rem', color: '#fff' }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
