import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((variant, message, title) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, variant, message, title }]);
    // auto-remove
    setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), 5000);
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant || 'light'} onClose={() => remove(t.id)}>
            {t.title && <Toast.Header><strong className="me-auto">{t.title}</strong></Toast.Header>}
            <Toast.Body>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export default ToastProvider;
