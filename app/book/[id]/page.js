'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PremiumModal from '@/components/PremiumModal';
import AuthModal from '@/components/AuthModal';
import BookPurchaseModal from '@/components/BookPurchaseModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function BookPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { user, toggleSaveBook, isBookSaved, checkAuth } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [buying, setBuying] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchBook();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/books/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data.book);
      }
    } catch (e) {
      console.error('Failed to fetch book:', e);
    }
    setLoading(false);
  };

  const handleReadOnline = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (user.isPremium) {
      // Register book in currently reading list
      try {
        const token = localStorage.getItem('anjir-token');
        await fetch('/api/users/reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bookId: book.id })
        });
        checkAuth(); // refresh user reading list in context
      } catch (err) {
        console.error('Failed to add to reading list', err);
      }

      // Open reader in a new tab
      window.open(`/book/${book.id}/read`, '_blank');
    } else {
      setShowPremium(true);
    }
  };

  const handleBuyBook = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowBuyModal(true);
  };

  const handleSave = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    await toggleSaveBook(book.id);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Header />
        <div className={styles.notFound}>
          <span>📭</span>
          <p>Kitob topilmadi</p>
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            {t('backToHome')}
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const title = lang === 'ru' && book.titleRu ? book.titleRu : book.title;
  const author = lang === 'ru' && book.authorRu ? book.authorRu : book.author;
  const description = lang === 'ru' && book.descriptionRu ? book.descriptionRu : book.description;
  const content = lang === 'ru' && book.contentRu ? book.contentRu : book.content;
  const saved = isBookSaved(book.id);

  const hasPremium = user && user.isPremium;
  const discountPrice = hasPremium ? Math.round(book.price * 0.8) : Math.round(book.price * 0.8);

  return (
    <>
      <Header />
      <main className={`container ${styles.page}`}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ← {t('backToHome')}
        </button>

        <div className={styles.bookLayout}>
          <div className={styles.coverWrap}>
            {book.image ? (
              <div 
                className={styles.coverImage} 
                style={{ backgroundImage: `url(${book.image})` }}
              />
            ) : (
              <div className={styles.cover}>
                <div className={styles.coverInner}>
                  <span className={styles.coverEmoji}>📖</span>
                  <h2 className={styles.coverTitle}>{title}</h2>
                  <p className={styles.coverAuthor}>{author}</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.details}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.author}>
              <span className={styles.label}>{t('author')}:</span> {author}
            </p>
            <p className={styles.categoryBadge}>
              <span className="badge badge-accent">{t(book.category)}</span>
              {book.sold > 0 && (
                <span className="badge badge-success">{book.sold} {t('soldCount')}</span>
              )}
            </p>

            <p className={styles.description}>{description}</p>

            {/* Price display with discount details */}
            <div className={styles.priceBox}>
              {hasPremium ? (
                <div className={styles.priceRow}>
                  <span className={styles.oldPrice}>
                    {book.price?.toLocaleString()} {t('bookPrice')}
                  </span>
                  <span className={styles.price}>
                    {Math.round(book.price * 0.8)?.toLocaleString()} {t('bookPrice')} 
                    <span className={styles.discountBadge}>-20% Premium</span>
                  </span>
                </div>
              ) : (
                <div className={styles.priceRowNonPremium}>
                  <span className={styles.price}>
                    {book.price?.toLocaleString()} {t('bookPrice')}
                  </span>
                  <div className={styles.premiumDiscountHint}>
                    👑 Premium a'zolar uchun: <strong>{discountPrice?.toLocaleString()} {t('bookPrice')}</strong> (-20%)
                  </div>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              <button className="btn btn-primary" onClick={handleReadOnline}>
                📖 {t('readOnline')}
              </button>
              <button className="btn btn-secondary" onClick={handleBuyBook} disabled={buying}>
                🛍️ {buying ? '...' : t('buyNow')}
              </button>
              <button 
                className={`btn btn-secondary ${saved ? styles.savedBtn : ''}`}
                onClick={handleSave}
              >
                {saved ? '❤️' : '🤍'} {saved ? t('savedBook') : t('saveBook')}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      
      {showAuthModal && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuthModal(false)}
          onSwitch={(mode) => {}}
        />
      )}

      {showBuyModal && (
        <BookPurchaseModal
          book={book}
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            showToast(t('buyBookSuccess'), 'success');
          }}
        />
      )}

      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
