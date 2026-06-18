import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const dataDir = path.join(process.cwd(), 'data');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase Connection
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// JSON Helper Functions (Fallback)
function readData(filename) {
  const filePath = path.join(dataDir, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeData(filename, data) {
  if (!supabase) {
    const filePath = path.join(dataDir, filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to write to local file database (${filename}):`, error);
      throw new Error(`Local file system database write failed. When deploying to Vercel, you must set up and connect a Supabase database. (Original error: ${error.message})`);
    }
  }
}

// ---------------------------------------------------------
// Books
// ---------------------------------------------------------
export async function getBooks(search = '', category = '') {
  if (supabase) {
    let query = supabase.from('books').select('*');
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,title_ru.ilike.%${search}%,author_ru.ilike.%${search}%`);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) console.error('Supabase getBooks error:', error);
    
    // Map SnakeCase from DB to CamelCase for App
    return (data || []).map(b => ({
      ...b,
      titleRu: b.title_ru,
      authorRu: b.author_ru,
      descriptionRu: b.description_ru,
      contentRu: b.content_ru,
      pdfUrl: b.pdf_url,
      pdfFile: b.pdf_file,
      createdAt: b.created_at
    }));
  } else {
    let books = readData('books.json');
    if (search) {
      const s = search.toLowerCase();
      books = books.filter(b =>
        b.title.toLowerCase().includes(s) ||
        b.author.toLowerCase().includes(s) ||
        (b.titleRu && b.titleRu.toLowerCase().includes(s)) ||
        (b.authorRu && b.authorRu.toLowerCase().includes(s))
      );
    }
    if (category && category !== 'all') {
      books = books.filter(b => b.category === category);
    }
    return books;
  }
}

export async function getBookById(id) {
  if (supabase) {
    const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
    if (error) return null;
    return {
      ...data,
      titleRu: data.title_ru,
      authorRu: data.author_ru,
      descriptionRu: data.description_ru,
      contentRu: data.content_ru,
      pdfUrl: data.pdf_url,
      pdfFile: data.pdf_file,
      createdAt: data.created_at
    };
  } else {
    const books = readData('books.json');
    return books.find(b => b.id === id) || null;
  }
}

export async function addBook(bookData) {
  if (supabase) {
    const { data: books } = await supabase.from('books').select('id');
    const newId = String(Math.max(0, ...(books || []).map(b => parseInt(b.id))) + 1);
    
    const dbData = {
      id: newId,
      title: bookData.title,
      title_ru: bookData.titleRu || '',
      author: bookData.author,
      author_ru: bookData.authorRu || '',
      price: Number(bookData.price),
      description: bookData.description || '',
      description_ru: bookData.descriptionRu || '',
      category: bookData.category || 'modern',
      image: bookData.image || '',
      content: bookData.content || '',
      content_ru: bookData.contentRu || '',
      pdf_url: bookData.pdfUrl || '',
      pdf_file: bookData.pdfFile || '',
      sold: 0
    };
    
    const { data, error } = await supabase.from('books').insert(dbData).select().single();
    if (error) throw error;
    return data;
  } else {
    const books = readData('books.json');
    const newId = String(Math.max(0, ...books.map(b => parseInt(b.id))) + 1);
    const newBook = { ...bookData, id: newId, sold: 0, createdAt: new Date().toISOString() };
    books.push(newBook);
    writeData('books.json', books);
    return newBook;
  }
}

export async function updateBook(id, updates) {
  if (supabase) {
    const dbUpdates = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.titleRu) dbUpdates.title_ru = updates.titleRu;
    if (updates.author) dbUpdates.author = updates.author;
    if (updates.authorRu) dbUpdates.author_ru = updates.authorRu;
    if (updates.price) dbUpdates.price = Number(updates.price);
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.descriptionRu) dbUpdates.description_ru = updates.descriptionRu;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.image) dbUpdates.image = updates.image;
    if (updates.content) dbUpdates.content = updates.content;
    if (updates.contentRu) dbUpdates.content_ru = updates.contentRu;
    if (updates.pdfUrl) dbUpdates.pdf_url = updates.pdfUrl;
    if (updates.pdfFile) dbUpdates.pdf_file = updates.pdfFile;
    if (updates.sold !== undefined) dbUpdates.sold = updates.sold;

    const { data, error } = await supabase.from('books').update(dbUpdates).eq('id', id).select().single();
    if (error) return null;
    return data;
  } else {
    const books = readData('books.json');
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return null;
    books[index] = { ...books[index], ...updates };
    writeData('books.json', books);
    return books[index];
  }
}

export async function deleteBook(id) {
  if (supabase) {
    const { error } = await supabase.from('books').delete().eq('id', id);
    return !error;
  } else {
    let books = readData('books.json');
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return false;
    books = books.filter(b => b.id !== id);
    writeData('books.json', books);
    return true;
  }
}

// ---------------------------------------------------------
// Users
// ---------------------------------------------------------
export async function getUsers() {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    
    const users = data.map(u => ({
      ...u,
      isPremium: u.is_premium,
      savedBooks: u.saved_books || [],
      premiumExpiresAt: u.premium_expires_at,
      createdAt: u.created_at
    }));

    // Auto-expiry check
    for (const user of users) {
      if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
        await supabase.from('users').update({ is_premium: false, premium_expires_at: null }).eq('id', user.id);
        user.isPremium = false;
        user.premiumExpiresAt = null;
      }
    }
    return users;
  } else {
    const users = readData('users.json');
    let changed = false;
    const updatedUsers = users.map(user => {
      if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
        user.isPremium = false;
        user.premiumExpiresAt = null;
        changed = true;
      }
      return user;
    });
    if (changed) {
      writeData('users.json', updatedUsers);
    }
    return updatedUsers;
  }
}

export async function getUserById(id) {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    
    const user = {
      ...data,
      isPremium: data.is_premium,
      savedBooks: data.saved_books || [],
      premiumExpiresAt: data.premium_expires_at,
      createdAt: data.created_at
    };

    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      await supabase.from('users').update({ is_premium: false, premium_expires_at: null }).eq('id', id);
      user.isPremium = false;
      user.premiumExpiresAt = null;
    }
    return user;
  } else {
    const users = readData('users.json');
    const user = users.find(u => u.id === id);
    if (user && user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      updateUser(id, { isPremium: false, premiumExpiresAt: null });
    }
    return user || null;
  }
}

export async function getUserByPhone(phone) {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).single();
    if (error) return null;
    return {
      ...data,
      isPremium: data.is_premium,
      savedBooks: data.saved_books || [],
      premiumExpiresAt: data.premium_expires_at,
      createdAt: data.created_at
    };
  } else {
    const users = readData('users.json');
    return users.find(u => u.phone === phone) || null;
  }
}

export async function createUser(userData) {
  if (supabase) {
    const { data: users } = await supabase.from('users').select('id');
    const newId = String(Math.max(0, ...(users || []).map(u => parseInt(u.id))) + 1);
    
    const dbData = {
      id: newId,
      name: userData.name,
      phone: userData.phone,
      password: userData.password,
      is_premium: false,
      saved_books: []
    };
    
    const { data, error } = await supabase.from('users').insert(dbData).select().single();
    if (error) throw error;
    return {
      ...data,
      isPremium: data.is_premium,
      savedBooks: data.saved_books,
      premiumExpiresAt: data.premium_expires_at,
      createdAt: data.created_at
    };
  } else {
    const users = readData('users.json');
    const newId = String(Math.max(0, ...users.map(u => parseInt(u.id))) + 1);
    const newUser = {
      id: newId,
      ...userData,
      isPremium: false,
      savedBooks: [],
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeData('users.json', users);
    return newUser;
  }
}

export async function updateUser(id, updates) {
  if (supabase) {
    const dbUpdates = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.password) dbUpdates.password = updates.password;
    if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
    if (updates.savedBooks) dbUpdates.saved_books = updates.savedBooks;
    if (updates.premiumExpiresAt !== undefined) dbUpdates.premium_expires_at = updates.premiumExpiresAt;

    const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
    if (error) {
      console.error('Supabase updateUser error:', error);
      return null;
    }
    return {
      ...data,
      isPremium: data.is_premium,
      savedBooks: data.saved_books,
      premiumExpiresAt: data.premium_expires_at,
      createdAt: data.created_at
    };
  } else {
    const users = readData('users.json');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    writeData('users.json', users);
    return users[index];
  }
}

export async function deleteUser(id) {
  if (supabase) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } else {
    let users = readData('users.json');
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;
    users = users.filter(u => u.id !== id);
    writeData('users.json', users);
    return true;
  }
}

// ---------------------------------------------------------
// Orders
// ---------------------------------------------------------
export async function getOrders() {
  if (supabase) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map(o => ({
      ...o,
      userId: o.user_id,
      bookId: o.book_id,
      bookTitle: o.book_title,
      userName: o.user_name,
      userPhone: o.user_phone,
      createdAt: o.created_at
    }));
  } else {
    return readData('orders.json');
  }
}

export async function getOrdersByUserId(userId) {
  if (supabase) {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map(o => ({
      ...o,
      userId: o.user_id,
      bookId: o.book_id,
      bookTitle: o.book_title,
      userName: o.user_name,
      userPhone: o.user_phone,
      createdAt: o.created_at
    }));
  } else {
    const orders = readData('orders.json');
    return orders.filter(o => o.userId === userId);
  }
}

export async function addOrder(orderData) {
  if (supabase) {
    const { data: orders } = await supabase.from('orders').select('id');
    const newId = String(Math.max(0, ...(orders || []).map(o => parseInt(o.id))) + 1);
    
    const dbData = {
      id: newId,
      user_id: orderData.userId,
      book_id: orderData.bookId,
      book_title: orderData.bookTitle,
      price: Number(orderData.price),
      user_name: orderData.userName,
      user_phone: orderData.userPhone
    };
    
    const { data, error } = await supabase.from('orders').insert(dbData).select().single();
    if (error) throw error;
    
    // Update book sold count
    await supabase.rpc('increment_sold', { book_id: orderData.bookId });
    
    return {
      ...data,
      userId: data.user_id,
      bookId: data.book_id,
      bookTitle: data.book_title,
      userName: data.user_name,
      userPhone: data.user_phone,
      createdAt: data.created_at
    };
  } else {
    const orders = readData('orders.json');
    const newId = String(Math.max(0, ...orders.map(o => parseInt(o.id))) + 1);
    const newOrder = { ...orderData, id: newId, createdAt: new Date().toISOString() };
    orders.push(newOrder);
    writeData('orders.json', orders);
    
    const books = readData('books.json');
    const bookIndex = books.findIndex(b => b.id === orderData.bookId);
    if (bookIndex !== -1) {
      books[bookIndex].sold = (books[bookIndex].sold || 0) + 1;
      writeData('books.json', books);
    }
    
    return newOrder;
  }
}

// ---------------------------------------------------------
// Stats
// ---------------------------------------------------------
export async function getStats() {
  let books, users, orders;
  
  if (supabase) {
    const { data: b } = await supabase.from('books').select('*');
    const { data: u } = await supabase.from('users').select('*');
    const { data: o } = await supabase.from('orders').select('*');
    books = b || [];
    users = u || [];
    orders = o || [];
  } else {
    books = readData('books.json');
    users = readData('users.json');
    orders = readData('orders.json');
  }
  
  const totalBooks = books.length;
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
  const premiumUsersCount = users.filter(u => u.is_premium || u.isPremium).length;
  const totalSold = books.reduce((sum, b) => sum + (Number(b.sold) || 0), 0);
  
  const categoryStats = {};
  books.forEach(b => {
    if (!categoryStats[b.category]) categoryStats[b.category] = 0;
    categoryStats[b.category] += (b.sold || 0);
  });
  
  const recentOrders = orders.slice(-10).reverse();
  const topBooks = [...books].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);

  return {
    totalBooks,
    totalUsers,
    totalOrders,
    totalRevenue,
    premiumUsers: premiumUsersCount,
    totalSold,
    categoryStats,
    recentOrders,
    topBooks
  };
}
