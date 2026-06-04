'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (newPassword.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(t('adminPasswordChanged'));
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || t('adminPasswordError'));
      }
    } catch (err) {
      setError(t('adminPasswordError'));
    }
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>⚙️ {t('adminSettings')}</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{t('adminSettingsTitle')}</h2>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>{t('newPassword')}</label>
            <input
              className="input"
              type="password"
              placeholder="••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('confirmNewPassword')}</label>
            <input
              className="input"
              type="password"
              placeholder="••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {success && <p className={styles.successText}>{success}</p>}
          {error && <p className={styles.errorText}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '⏳' : `💾 ${t('saveChanges')}`}
          </button>
        </form>
      </div>
    </div>
  );
}
