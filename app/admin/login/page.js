'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        router.push('/admin');
      } else {
        setError(t('adminLoginError'));
      }
    } catch (e) {
      setError('Server error');
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <button className={styles.themeBtn} onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.icon}>⚙️</div>
          <h1 className={styles.title}>{t('adminLogin')}</h1>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Login</label>
            <input
              className="input"
              type="text"
              placeholder="admin"
              value={login}
              onChange={e => setLogin(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('password')}</label>
            <input
              className="input"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={`btn btn-primary ${styles.submitBtn}`}
            type="submit"
            disabled={loading}
          >
            {loading ? '⏳' : `🔐 ${t('adminLoginBtn')}`}
          </button>
        </form>

        <a href="/" className={styles.homeLink}>← {t('backToHome')}</a>
      </div>
    </div>
  );
}
