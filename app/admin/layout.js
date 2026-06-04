'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import AdminSidebar from '@/components/AdminSidebar';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setChecking(false);
      setIsAuth(false);
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Verify token by making a request
    fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (res.ok) {
        setIsAuth(true);
      } else {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
      }
      setChecking(false);
    }).catch(() => {
      router.push('/admin/login');
      setChecking(false);
    });
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!isAuth) return null;

  return (
    <div className={styles.layout}>
      <AdminSidebar onLogout={handleLogout} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
