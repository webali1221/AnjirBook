'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './AuthModal.module.css';

export default function AuthModal({ mode, onClose, onSwitch }) {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) { setError(t('phoneRequired')); return; }
    if (!password.trim()) { setError(t('passwordRequired')); return; }
    if (mode === 'register' && !name.trim()) { setError(t('nameRequired')); return; }

    setLoading(true);
    let result;

    if (mode === 'login') {
      result = await login(phone, password);
      if (!result.success) setError(result.error || t('loginError'));
    } else {
      result = await register(name, phone, password);
      if (!result.success) setError(result.error || t('registerError'));
    }

    setLoading(false);
    if (result.success) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            {mode === 'login' ? '🔑' : '📝'}
          </div>
          <h2 className={styles.modalTitle}>
            {mode === 'login' ? t('loginTitle') : t('registerTitle')}
          </h2>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>{t('name')}</label>
              <input
                className="input"
                type="text"
                placeholder={t('namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>{t('phone')}</label>
            <input
              className="input"
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('password')}</label>
            <input
              className="input"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button 
            className={`btn btn-primary ${styles.submitBtn}`}
            type="submit"
            disabled={loading}
          >
            {loading ? '⏳' : (mode === 'login' ? t('loginBtn') : t('registerBtn'))}
          </button>
        </form>

        <div className={styles.switchMode}>
          <span className={styles.switchText}>
            {mode === 'login' ? t('noAccount') : t('hasAccount')}
          </span>
          <button 
            className={styles.switchBtn}
            onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? t('registerHere') : t('loginHere')}
          </button>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
