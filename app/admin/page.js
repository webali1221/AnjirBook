'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function AdminDashboard() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className={styles.loading}><div className={styles.spinner}></div></div>;
  }

  if (!stats) return <p>Ma'lumotlar yuklanmadi</p>;

  const statCards = [
    { icon: '📚', label: t('totalBooks'), value: stats.totalBooks, color: '#3B82F6' },
    { icon: '👥', label: t('totalUsers'), value: stats.totalUsers, color: '#22C55E' },
    { icon: '🛒', label: t('totalSold'), value: stats.totalSold, color: '#F5A623' },
    { icon: '💰', label: t('totalRevenue'), value: `${stats.totalRevenue?.toLocaleString()} so'm`, color: '#EF4444' },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>📊 {t('adminDashboard')}</h1>

      {/* Stat Cards */}
      <div className={styles.statGrid}>
        {statCards.map((stat, i) => (
          <div key={i} className={styles.statCard} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={styles.statIcon} style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Books */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🏆 {t('topBooks')}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('bookTitle')}</th>
                <th>{t('bookAuthor')}</th>
                <th>{t('totalSold')}</th>
                <th>{t('bookPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.topBooks?.map((book, i) => (
                <tr key={book.id}>
                  <td className={styles.rank}>{i + 1}</td>
                  <td className={styles.bookName}>
                    {lang === 'ru' && book.titleRu ? book.titleRu : book.title}
                  </td>
                  <td>{lang === 'ru' && book.authorRu ? book.authorRu : book.author}</td>
                  <td><span className="badge badge-success">{book.sold}</span></td>
                  <td>{book.price?.toLocaleString()} so'm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🕐 {t('recentOrders')}</h2>
        {stats.recentOrders?.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('orderId')}</th>
                  <th>{t('orderBook')}</th>
                  <th>{t('orderUser')}</th>
                  <th>{t('orderPrice')}</th>
                  <th>{t('orderDate')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.bookTitle}</td>
                    <td>{order.userName}</td>
                    <td>{order.price?.toLocaleString()} so'm</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyText}>Buyurtmalar yo'q</p>
        )}
      </div>

      {/* Category Stats */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📁 Kategoriyalar</h2>
        <div className={styles.catGrid}>
          {Object.entries(stats.categoryStats || {}).map(([cat, count]) => (
            <div key={cat} className={styles.catCard}>
              <span className={styles.catName}>{t(cat)}</span>
              <span className={styles.catCount}>{count} {t('soldCount')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
