'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar({ isOpen, onClose, onLogout }) {
  const { t } = useLanguage();
  const pathname = usePathname();

  const links = [
    { href: '/admin', icon: '📊', label: t('adminDashboard') },
    { href: '/admin/books', icon: '📚', label: t('adminBooks') },
    { href: '/admin/users', icon: '👥', label: t('adminUsers') },
    { href: '/admin/settings', icon: '⚙️', label: t('adminSettings') },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚙️</span>
            <span className={styles.logoText}>Admin Panel</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <nav className={styles.nav}>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
              onClick={onClose}
            >
              <span className={styles.linkIcon}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.bottom}>
          <Link href="/" className={styles.link}>
            <span className={styles.linkIcon}>🏠</span>
            <span>{t('home')}</span>
          </Link>
          <button className={styles.logoutBtn} onClick={onLogout}>
            <span className={styles.linkIcon}>🚪</span>
            <span>{t('adminLogout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
