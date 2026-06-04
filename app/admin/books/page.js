'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function AdminBooksPage() {
  const { t, lang } = useLanguage();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState({
    title: '', titleRu: '', author: '', authorRu: '',
    price: '', description: '', descriptionRu: '',
    category: 'modern', image: '', pdfUrl: '', content: '', contentRu: ''
  });

  useEffect(() => { fetchBooks(); }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      setBooks(data.books || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getToken = () => localStorage.getItem('adminToken');

  const resetForm = () => {
    setForm({
      title: '', titleRu: '', author: '', authorRu: '',
      price: '', description: '', descriptionRu: '',
      category: 'modern', image: '', pdfUrl: '', content: '', contentRu: ''
    });
    setEditingBook(null);
    setShowForm(false);
  };

  const handleEdit = (book) => {
    setForm({
      title: book.title || '',
      titleRu: book.titleRu || '',
      author: book.author || '',
      authorRu: book.authorRu || '',
      price: book.price || '',
      description: book.description || '',
      descriptionRu: book.descriptionRu || '',
      category: book.category || 'modern',
      image: book.image || '',
      pdfUrl: book.pdfUrl || '',
      content: book.content || '',
      contentRu: book.contentRu || ''
    });
    setEditingBook(book);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
    const method = editingBook ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, price: Number(form.price) })
      });

      if (res.ok) {
        resetForm();
        fetchBooks();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('confirmDelete'))) return;
    const token = getToken();
    try {
      await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchBooks();
    } catch (e) { console.error(e); }
  };

  const categories = ['classic', 'adventure', 'autobiography', 'folklore', 'poetry', 'modern'];

  if (loading) {
    return <div className={styles.loading}><div className={styles.spinner}></div></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📚 {t('adminBooks')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          ➕ {t('addBook')}
        </button>
      </div>

      {/* Book Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className={styles.formModal} onClick={e => e.stopPropagation()}>
            <div className={styles.formHeader}>
              <h2>{editingBook ? t('editBook') : t('addBook')}</h2>
              <button className={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>{t('bookTitle')} *</label>
                  <input className="input" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className={styles.field}>
                  <label>{t('bookTitleRu')}</label>
                  <input className="input" value={form.titleRu}
                    onChange={e => setForm({ ...form, titleRu: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>{t('bookAuthor')} *</label>
                  <input className="input" value={form.author}
                    onChange={e => setForm({ ...form, author: e.target.value })} required />
                </div>
                <div className={styles.field}>
                  <label>{t('bookAuthorRu')}</label>
                  <input className="input" value={form.authorRu}
                    onChange={e => setForm({ ...form, authorRu: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>{t('bookPrice')} *</label>
                  <input className="input" type="number" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className={styles.field}>
                  <label>{t('bookCategory')}</label>
                  <select className="select" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => (
                      <option key={c} value={c}>{t(c)}</option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                  <label>{t('bookImage')} (URL)</label>
                  <input className="input" value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/cover.jpg" />
                  
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Yoki kompyuterdan rasm yuklang:
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => ({ ...prev, image: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </div>
                  {form.image && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={form.image} alt="Preview" style={{ maxHeight: '80px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>

                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                  <label>{t('bookPdfUrl')} (URL)</label>
                  <input className="input" value={form.pdfUrl}
                    onChange={e => setForm({ ...form, pdfUrl: e.target.value })} placeholder="https://example.com/book.pdf" />
                  
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Yoki kompyuterdan PDF kitob yuklang:
                    </label>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm(prev => ({ ...prev, pdfUrl: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label>{t('bookDescription')}</label>
                <textarea className="textarea" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>{t('bookDescriptionRu')}</label>
                <textarea className="textarea" value={form.descriptionRu}
                  onChange={e => setForm({ ...form, descriptionRu: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>{t('bookContentLabel')}</label>
                <textarea className="textarea" rows={6} value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>{t('bookContentRu')}</label>
                <textarea className="textarea" rows={6} value={form.contentRu}
                  onChange={e => setForm({ ...form, contentRu: e.target.value })} />
              </div>

              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBook ? t('saveChanges') : t('addBook')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Books Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('bookTitle')}</th>
              <th>{t('bookAuthor')}</th>
              <th>{t('bookCategory')}</th>
              <th>{t('bookPrice')}</th>
              <th>{t('totalSold')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id}>
                <td>#{book.id}</td>
                <td className={styles.bookName}>
                  {lang === 'ru' && book.titleRu ? book.titleRu : book.title}
                </td>
                <td>{lang === 'ru' && book.authorRu ? book.authorRu : book.author}</td>
                <td><span className="badge badge-accent">{t(book.category)}</span></td>
                <td>{book.price?.toLocaleString()} so'm</td>
                <td><span className="badge badge-success">{book.sold || 0}</span></td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(book)}>
                      ✏️ {t('editBook')}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(book.id)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
