'use client';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './BookCard.module.css';

const COLORS = [
  'linear-gradient(135deg, #F5A623, #FFD700)',
  'linear-gradient(135deg, #E74C3C, #FF6B6B)',
  'linear-gradient(135deg, #3498DB, #5DADE2)',
  'linear-gradient(135deg, #2ECC71, #58D68D)',
  'linear-gradient(135deg, #9B59B6, #BB8FCE)',
  'linear-gradient(135deg, #E67E22, #F0B27A)',
  'linear-gradient(135deg, #1ABC9C, #48C9B0)',
  'linear-gradient(135deg, #34495E, #5D6D7E)',
];

export default function BookCard({ book, index = 0 }) {
  const { lang, t } = useLanguage();
  const { user, toggleSaveBook, isBookSaved } = useAuth();
  const saved = isBookSaved(book.id);

  const title = lang === 'ru' && book.titleRu ? book.titleRu : book.title;
  const author = lang === 'ru' && book.authorRu ? book.authorRu : book.author;
  const gradient = COLORS[index % COLORS.length];

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    await toggleSaveBook(book.id);
  };

  const hasPremium = user && user.isPremium;
  const discountPrice = hasPremium ? Math.round(book.price * 0.8) : null;

  return (
    <Link href={`/book/${book.id}`} className={styles.card} style={{ animationDelay: `${index * 0.08}s` }}>
      <div 
        className={styles.cover} 
        style={book.image ? { backgroundImage: `url(${book.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: gradient }}
      >
        {!book.image && (
          <>
            <div className={styles.coverPattern}></div>
            <div className={styles.coverContent}>
              <span className={styles.coverEmoji}>📖</span>
              <h3 className={styles.coverTitle}>{title}</h3>
              <p className={styles.coverAuthor}>{author}</p>
            </div>
          </>
        )}
        {user && (
          <button 
            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
            onClick={handleSave}
            title={saved ? t('removeFromSaved') : t('saveBook')}
          >
            {saved ? '❤️' : '🤍'}
          </button>
        )}
        <div className={styles.badge}>
          {book.sold > 0 && <span>{book.sold} {t('soldCount')}</span>}
        </div>
      </div>

      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.author}>{author}</p>
        <div className={styles.bottom}>
          <span className={styles.price}>
            {hasPremium ? (
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span style={{ fontSize: '11px', textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  {book.price?.toLocaleString()} so'm
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: '800' }}>
                  {discountPrice?.toLocaleString()} so'm <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 'bold' }}>-20%</span>
                </span>
              </span>
            ) : (
              <span>{book.price?.toLocaleString()} so'm</span>
            )}
          </span>
          <span className={styles.buyBtn}>{t('buyNow')} →</span>
        </div>
      </div>
    </Link>
  );
}
