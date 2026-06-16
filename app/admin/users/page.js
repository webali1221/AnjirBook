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

  const handleDelete = async (id) => {
    if (!confirm("Haqiqatan ham ushbu foydalanuvchini o'chirmoqchimisiz?")) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert("O'chirishda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      alert("Xatolik: " + e.message);
    }
  };

  const handlePremiumToggle = async (userId, action, duration = 1) => {
    if (action === 'disable' && !confirm("Foydalanuvchidan premiumni olib tashlamoqchimisiz?")) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, duration })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.id === userId ? data.user : u));
      } else {
        const data = await res.json();
        alert(data.error || "Xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
    }
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
                <th>Muddati</th>
                <th>{t('saved')}</th>
                <th>{t('userDate')}</th>
                <th>Amallar</th>
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
                  <td className={styles.expiryCell}>
                    {user.isPremium && user.premiumExpiresAt ? (
                      <span className={styles.expiryDate}>
                        {new Date(user.premiumExpiresAt).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td>{user.savedBooks?.length || 0}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionGroup}>
                      {user.isPremium ? (
                        <button 
                          className={styles.premiumOffBtn}
                          onClick={() => handlePremiumToggle(user.id, 'disable')}
                          title="Premiumni o'chirish"
                        >
                          🚫
                        </button>
                      ) : (
                        <div className={styles.enableGroup}>
                          <select 
                            id={`duration-${user.id}`}
                            className={styles.durationSelect}
                            defaultValue="1"
                          >
                            <option value="1">1 oy</option>
                            <option value="3">3 oy</option>
                            <option value="6">6 oy</option>
                            <option value="12">1 yil</option>
                          </select>
                          <button 
                            className={styles.premiumOnBtn}
                            onClick={() => {
                              const duration = document.getElementById(`duration-${user.id}`).value;
                              handlePremiumToggle(user.id, 'enable', duration);
                            }}
                            title="Premiumni yoqish"
                          >
                            👑
                          </button>
                        </div>
                      )}
                      
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => handleDelete(user.id)}
                        title="O'chirish"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
