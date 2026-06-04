'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookCard from '@/components/BookCard';
import AuthModal from '@/components/AuthModal';
import PremiumModal from '@/components/PremiumModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, checkAuth, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('orders');
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [readingBooksList, setReadingBooksList] = useState([]);
  const [savedBooksList, setSavedBooksList] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Edit fields
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  // Subscriptions
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      fetchUserLists();
    }
  }, [user]);

  // Expiry countdown timer
  useEffect(() => {
    if (!user?.premiumExpiresAt || !user?.isPremium) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const diffMs = new Date(user.premiumExpiresAt) - new Date();
      if (diffMs <= 0) {
        setTimeLeft(t('premiumInactive'));
        checkAuth(); // refresh auth state if expired
        return;
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let timeString = '';
      if (diffDays > 0) {
        timeString += `${diffDays} ${t('premiumTimeDays')} `;
      }
      if (diffDays > 0 || diffHours > 0) {
        timeString += `${diffHours} ${t('premiumTimeHours')} `;
      }
      timeString += `${diffMins} ${t('premiumTimeMins')}`;

      setTimeLeft(timeString);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [user?.premiumExpiresAt, user?.isPremium, t]);

  const fetchUserLists = async () => {
    setLoadingLists(true);
    try {
      const token = localStorage.getItem('anjir-token');
      
      // Fetch user orders
      const ordersRes = await fetch('/api/orders/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let orderedBookIds = [];
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        orderedBookIds = ordersData.orders?.map(o => o.bookId) || [];
      }

      // Fetch all books to filter
      const booksRes = await fetch('/api/books');
      if (booksRes.ok) {
        const booksData = await booksRes.json();
        const allBooks = booksData.books || [];

        // 1. Filter purchased books
        const filteredPurchased = allBooks.filter(b => orderedBookIds.includes(b.id));
        setPurchasedBooks(filteredPurchased);

        // 2. Filter saved books
        const filteredSaved = allBooks.filter(b => user.savedBooks?.includes(b.id));
        setSavedBooksList(filteredSaved);

        // 3. Filter reading books
        const filteredReading = allBooks.filter(b => user.readingBooks?.includes(b.id));
        setReadingBooksList(filteredReading);
      }
    } catch (e) {
      console.error('Error fetching lists:', e);
    }
    setLoadingLists(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    if (password && password !== confirmPassword) {
      setUpdateError("Yangi parollar mos kelmadi");
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('anjir-token');
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          ...(password ? { password } : {})
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess(t('profileSaved'));
        setPassword('');
        setConfirmPassword('');
        checkAuth(); // refresh user details in context
      } else {
        setUpdateError(data.error || t('profileError'));
      }
    } catch (err) {
      setUpdateError(t('profileError'));
    }
    setUpdating(false);
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className={`container ${styles.unauthPage}`}>
          <div className={styles.unauthCard}>
            <span className={styles.lockIcon}>🔐</span>
            <h2>{t('profileTitle')}</h2>
            <p>Profilingizni ko'rish va boshqarish uchun tizimga kiring.</p>
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
              {t('login')}
            </button>
          </div>
        </main>
        <Footer />
        {showAuthModal && (
          <AuthModal
            mode="login"
            onClose={() => setShowAuthModal(false)}
            onSwitch={(mode) => {}}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={`container ${styles.page}`}>
        <h1 className={styles.title}>👤 {t('profileTitle')}</h1>

        <div className={styles.layout}>
          {/* Left panel: Info & Edit Settings */}
          <section className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={styles.avatarBig}>
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <h2 className={styles.userName}>{user.name}</h2>
              <p className={styles.userPhone}>{user.phone}</p>
              
              {/* Premium status */}
              <div className={`${styles.premiumStatusBox} ${user.isPremium ? styles.premiumActiveBox : ''}`}>
                <div className={styles.premiumHeaderLine}>
                  <span className={styles.crownIcon}>👑</span>
                  <span className={styles.premiumLabel}>{t('premiumStatus')}</span>
                </div>
                {user.isPremium ? (
                  <div className={styles.premiumInfo}>
                    <p className={styles.premiumActiveText}>✓ {t('premiumActive')}</p>
                    <p className={styles.premiumExpiry}>
                      <strong>{t('premiumExpires')}:</strong><br />
                      {new Date(user.premiumExpiresAt).toLocaleDateString()}
                    </p>
                    {timeLeft && (
                      <p className={styles.premiumTimeLeft}>
                        <strong>{t('premiumTimeLeft')}:</strong><br />
                        <span className={styles.timeLeftValue}>{timeLeft}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className={styles.premiumInfo}>
                    <p className={styles.premiumInactiveText}>{t('premiumInactive')}</p>
                  </div>
                )}
                <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }} onClick={() => setShowPremiumModal(true)}>
                  {user.isPremium ? "Uzatirish" : t('buyPremium')}
                </button>
              </div>
            </div>

            {/* Profile editing form */}
            <div className={styles.settingsCard}>
              <h3>⚙️ Sozlamalar</h3>
              <form className={styles.form} onSubmit={handleUpdateProfile}>
                <div className={styles.field}>
                  <label>{t('profileUsername')}</label>
                  <input
                    className="input"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                
                <hr className={styles.divider} />
                <p className={styles.changePassTitle}>🔒 Parolni yangilash (ixtiyoriy)</p>

                <div className={styles.field}>
                  <label>{t('newPassword')}</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>{t('confirmNewPassword')}</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                {updateError && <p className={styles.errorText}>{updateError}</p>}
                {updateSuccess && <p className={styles.successText}>{updateSuccess}</p>}

                <button className="btn btn-primary btn-sm" type="submit" disabled={updating}>
                  {updating ? '⏳' : t('saveChanges')}
                </button>
              </form>
            </div>
          </section>

          {/* Right panel: Book Lists (Tabs) */}
          <section className={styles.content}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                🛍️ {t('purchasedBooks')} ({purchasedBooks.length})
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'reading' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('reading')}
              >
                📖 {t('readingOnlineBooks')} ({readingBooksList.length})
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                ❤️ {t('savedTitle')} ({savedBooksList.length})
              </button>
            </div>

            <div className={styles.tabContent}>
              {loadingLists ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                </div>
              ) : activeTab === 'orders' ? (
                purchasedBooks.length === 0 ? (
                  <div className={styles.emptyList}>
                    <span>🛒</span>
                    <p>{t('noPurchasedBooks')}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')}>
                      {t('goToBooks')}
                    </button>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {purchasedBooks.map((book, i) => (
                      <BookCard key={book.id} book={book} index={i} />
                    ))}
                  </div>
                )
              ) : activeTab === 'reading' ? (
                readingBooksList.length === 0 ? (
                  <div className={styles.emptyList}>
                    <span>📖</span>
                    <p>{t('noReadingBooks')}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')}>
                      {t('goToBooks')}
                    </button>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {readingBooksList.map((book, i) => (
                      <BookCard key={book.id} book={book} index={i} />
                    ))}
                  </div>
                )
              ) : (
                savedBooksList.length === 0 ? (
                  <div className={styles.emptyList}>
                    <span>💔</span>
                    <p>{t('noSavedBooks')}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/')}>
                      {t('goToBooks')}
                    </button>
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {savedBooksList.map((book, i) => (
                      <BookCard key={book.id} book={book} index={i} />
                    ))}
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />

      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
    </>
  );
}
