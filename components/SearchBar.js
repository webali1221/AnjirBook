'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, onCategoryChange, activeCategory }) {
  const { t } = useLanguage();
  const categories = ['all', 'classic', 'adventure', 'autobiography', 'folklore', 'poetry', 'modern'];

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.input}
          type="text"
          placeholder={t('heroSearch')}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        {value && (
          <button className={styles.clearBtn} onClick={() => onChange('')}>✕</button>
        )}
      </div>
      
      <div className={styles.categories}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.catBtn} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {t(cat)}
          </button>
        ))}
      </div>
    </div>
  );
}
