'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.grid}>
          <div className={styles.about}>
            <div className={styles.logo}>
              <img src="/logo.jpg" alt="Anjir Book Logo" className={styles.logoImg} />
              <span className={styles.logoText}>Anjir<span className={styles.logoAccent}>Book</span></span>
            </div>
            <p className={styles.aboutText}>{t('footerAbout')}</p>
          </div>

          <div className={styles.links}>
            <h4 className={styles.heading}>{t('footerLinks')}</h4>
            <a href="/" className={styles.link}>{t('home')}</a>
            <a href="/saved" className={styles.link}>{t('saved')}</a>
            <a href="/admin/login" className={styles.link}>{t('admin')}</a>
          </div>

          <div className={styles.contact}>
            <h4 className={styles.heading}>{t('footerContact')}</h4>
            <p className={styles.contactItem}>📍 {t('footerAddress')}</p>
            <p className={styles.contactItem}>📞 {t('footerPhone')}</p>
            <p className={styles.contactItem}>✉️ {t('footerEmail')}</p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© 2025 Anjir Book. {t('footerRights')}.</p>
        </div>
      </div>
    </footer>
  );
}
