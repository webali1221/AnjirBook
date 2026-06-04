'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import styles from './Header.module.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenu, setMobileMenu] = useState(false);

  const openLogin = () => { setAuthMode('login'); setShowAuth(true); };
  const openRegister = () => { setAuthMode('register'); setShowAuth(true); };

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerInner}`}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.jpg" alt="Anjir Book Logo" className={styles.logoImg} />
            <span className={styles.logoText}>Anjir<span className={styles.logoAccent}>Book</span></span>
          </Link>

          <nav className={`${styles.nav} ${mobileMenu ? styles.navOpen : ''}`}>
            <Link href="/" className={styles.navLink} onClick={() => setMobileMenu(false)}>
              <span>🏠</span> {t('home')}
            </Link>
            {user && (
              <Link href="/saved" className={styles.navLink} onClick={() => setMobileMenu(false)}>
                <span>❤️</span> {t('saved')}
              </Link>
            )}
            {user && (
              <Link href="/profile" className={styles.navLink} onClick={() => setMobileMenu(false)}>
                <span>👤</span> {t('profile')}
              </Link>
            )}
          </nav>

          <div className={styles.actions}>
            <button 
              className={styles.langBtn} 
              onClick={toggleLang}
              title={lang === 'uz' ? 'Русский' : "O'zbekcha"}
            >
              {lang === 'uz' ? '🇷🇺 RU' : '🇺🇿 UZ'}
            </button>

            <button 
              className={styles.themeBtn} 
              onClick={toggleTheme}
              title={theme === 'light' ? t('darkMode') : t('lightMode')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {user ? (
              <div className={styles.userMenu}>
                <div className={styles.userAvatar}>
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className={styles.userName}>{user.name}</span>
                <button className={`btn btn-sm ${styles.logoutBtn}`} onClick={logout}>
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className={styles.authBtns}>
                <button className="btn btn-secondary btn-sm" onClick={openLogin}>
                  {t('login')}
                </button>
                <button className="btn btn-primary btn-sm" onClick={openRegister}>
                  {t('register')}
                </button>
              </div>
            )}

            <button 
              className={styles.hamburger} 
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSwitch={(mode) => setAuthMode(mode)}
        />
      )}
    </>
  );
}
