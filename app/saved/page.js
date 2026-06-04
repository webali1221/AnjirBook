'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookCard from '@/components/BookCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function SavedPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.savedBooks?.length) {
      fetchSavedBooks();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSavedBooks = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      const savedBooks = data.books.filter(b => user.savedBooks.includes(b.id));
      setBooks(savedBooks);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className={`container ${styles.page}`}>
        <h1 className={styles.title}>❤️ {t('savedTitle')}</h1>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
          </div>
        ) : books.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💔</span>
            <p>{t('noSavedBooks')}</p>
            <a href="/" className="btn btn-primary">{t('goToBooks')}</a>
          </div>
        ) : (
          <div className={styles.grid}>
            {books.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
