'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import BookCard from '@/components/BookCard';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function HomePage() {
  const { t } = useLanguage();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, [search, category]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category && category !== 'all') params.set('category', category);
      
      const res = await fetch(`/api/books?${params}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch (e) {
      console.error('Failed to fetch books:', e);
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>{t('heroTitle')}</h1>
              <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
            </div>
            <div className={styles.heroDecor}>
              <span className={styles.heroEmoji}>📚</span>
            </div>
          </div>
          <div className={styles.heroWave}></div>
        </section>

        {/* Search & Books */}
        <section className={`container ${styles.booksSection}`}>
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            onCategoryChange={setCategory}
            activeCategory={category}
          />

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          ) : books.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p>{t('noBooks')}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {books.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
