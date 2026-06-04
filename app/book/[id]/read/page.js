'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

// Haversine / Page split helper: split text into pages of ~1200 characters, keeping paragraphs intact
const paginateText = (text, charsPerPage = 1200) => {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const pages = [];
  let currentPage = '';

  for (const para of paragraphs) {
    if (currentPage.length + para.length > charsPerPage) {
      if (currentPage.trim()) {
        pages.push(currentPage.trim());
      }
      currentPage = para + '\n\n';
    } else {
      currentPage += para + '\n\n';
    }
  }
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  return pages;
};

export default function ReaderPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Reader settings
  const [readerTheme, setReaderTheme] = useState('sepia'); // 'light', 'sepia', 'dark'
  const [fontSize, setFontSize] = useState('medium'); // 'small', 'medium', 'large', 'xl'
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check authentication and premium status
    if (!authLoading) {
      if (!user) {
        router.push(`/book/${id}`);
        return;
      }
      if (!user.isPremium) {
        router.push(`/book/${id}?showPremium=true`);
        return;
      }
      fetchBook();
    }
  }, [id, user, authLoading]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages, currentPageIndex]);

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/books/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data.book);
        
        // Paginate content
        const content = lang === 'ru' && data.book.contentRu ? data.book.contentRu : data.book.content;
        if (content) {
          const paginated = paginateText(content);
          setPages(paginated);
        }
      }
    } catch (e) {
      console.error('Failed to fetch book data:', e);
    }
    setLoading(false);
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading || authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Kitob yuklanmoqda...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className={styles.errorScreen}>
        <span>📭</span>
        <p>Kitob topilmadi</p>
        <button className="btn btn-primary" onClick={() => router.push(`/book/${id}`)}>
          Ortga qaytish
        </button>
      </div>
    );
  }

  const title = lang === 'ru' && book.titleRu ? book.titleRu : book.title;
  const author = lang === 'ru' && book.authorRu ? book.authorRu : book.author;
  const progressPercent = pages.length > 0 ? Math.round(((currentPageIndex + 1) / pages.length) * 100) : 100;

  // Determine CSS class based on settings
  const readerClass = `${styles.readerWrapper} ${styles[readerTheme]} ${styles[`font_${fontSize}`]}`;

  return (
    <div className={readerClass}>
      {/* Top Navbar */}
      <header className={styles.navBar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => window.close()}>
            ✕ {t('close')}
          </button>
          <div className={styles.bookMeta}>
            <span className={styles.bookTitle}>{title}</span>
            <span className={styles.bookAuthor}>{author}</span>
          </div>
        </div>

        <div className={styles.navRight}>
          <button className={styles.settingsBtn} onClick={() => setShowSettings(!showSettings)}>
            ⚙️ Sozlamalar
          </button>

          {showSettings && (
            <div className={styles.settingsMenu}>
              <div className={styles.settingsSection}>
                <span className={styles.sectionLabel}>Ranglar</span>
                <div className={styles.themeSelector}>
                  <button 
                    className={`${styles.themeOption} ${styles.themeLight} ${readerTheme === 'light' ? styles.activeOption : ''}`}
                    onClick={() => setReaderTheme('light')}
                  >
                    Oq
                  </button>
                  <button 
                    className={`${styles.themeOption} ${styles.themeSepia} ${readerTheme === 'sepia' ? styles.activeOption : ''}`}
                    onClick={() => setReaderTheme('sepia')}
                  >
                    Sepia
                  </button>
                  <button 
                    className={`${styles.themeOption} ${styles.themeDark} ${readerTheme === 'dark' ? styles.activeOption : ''}`}
                    onClick={() => setReaderTheme('dark')}
                  >
                    To'q
                  </button>
                </div>
              </div>

              <div className={styles.settingsSection}>
                <span className={styles.sectionLabel}>Shrift o'lchami</span>
                <div className={styles.fontSelector}>
                  <button 
                    className={`${styles.fontOption} ${fontSize === 'small' ? styles.activeOption : ''}`}
                    onClick={() => setFontSize('small')}
                  >
                    A-
                  </button>
                  <button 
                    className={`${styles.fontOption} ${fontSize === 'medium' ? styles.activeOption : ''}`}
                    onClick={() => setFontSize('medium')}
                  >
                    A
                  </button>
                  <button 
                    className={`${styles.fontOption} ${fontSize === 'large' ? styles.activeOption : ''}`}
                    onClick={() => setFontSize('large')}
                  >
                    A+
                  </button>
                  <button 
                    className={`${styles.fontOption} ${fontSize === 'xl' ? styles.activeOption : ''}`}
                    onClick={() => setFontSize('xl')}
                  >
                    A++
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Reader Viewport */}
      <main className={styles.mainContainer}>
        {book.pdfUrl ? (
          <div className={styles.pdfFrameContainer}>
            <iframe
              src={book.pdfUrl}
              className={styles.pdfIframe}
              title={title}
            />
          </div>
        ) : pages.length > 0 ? (
          <div className={styles.pagesViewport}>
            <div className={styles.contentCard}>
              <div className={styles.contentBody}>
                {pages[currentPageIndex].split('\n\n').map((para, i) => (
                  <p key={i} className={styles.paragraph}>{para}</p>
                ))}
              </div>
            </div>

            {/* Navigation Overlay Areas (helpful for tablets and desktops) */}
            <div className={`${styles.navArea} ${styles.navAreaLeft}`} onClick={handlePrevPage} title="Oldingi sahifa" />
            <div className={`${styles.navArea} ${styles.navAreaRight}`} onClick={handleNextPage} title="Keyingi sahifa" />
          </div>
        ) : (
          <div className={styles.emptyContent}>
            <p>Kitob tarkibi mavjud emas</p>
          </div>
        )}
      </main>

      {/* Footer Navigation Bar */}
      {!book.pdfUrl && pages.length > 0 && (
        <footer className={styles.footerBar}>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
          </div>
          
          <div className={styles.footerInner}>
            <button 
              className={`btn ${styles.navBtn}`} 
              onClick={handlePrevPage} 
              disabled={currentPageIndex === 0}
            >
              ⬅️ Oldingi
            </button>

            <span className={styles.pageCounter}>
              Sahifa <strong>{currentPageIndex + 1}</strong> / {pages.length} ({progressPercent}%)
            </span>

            <button 
              className={`btn ${styles.navBtn}`} 
              onClick={handleNextPage} 
              disabled={currentPageIndex === pages.length - 1}
            >
              Keyingi ➡️
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
