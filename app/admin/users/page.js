'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className={styles.loading}><div className={styles.spinner}></div></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>👥 {t('adminUsers')}</h1>
        <span className={styles.count}>{users.length} {t('totalUsers').toLowerCase()}</span>
      </div>

      {users.length === 0 ? (
        <div className={styles.empty}>
          <span>👤</span>
          <p>Foydalanuvchilar yo'q</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('userId')}</th>
                <th>{t('userName')}</th>
                <th>{t('userPhone')}</th>
                <th>{t('userPremium')}</th>
                <th>{t('saved')}</th>
                <th>{t('userDate')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td className={styles.userName}>
                    <div className={styles.avatar}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {user.name}
                  </td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`badge ${user.isPremium ? 'badge-success' : 'badge-error'}`}>
                      {user.isPremium ? `👑 ${t('yes')}` : t('no')}
                    </span>
                  </td>
                  <td>{user.savedBooks?.length || 0}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
