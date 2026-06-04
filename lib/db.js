import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');

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
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Books
export function getBooks(search = '', category = '') {
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

export function getBookById(id) {
  const books = readData('books.json');
  return books.find(b => b.id === id) || null;
}

export function addBook(book) {
  const books = readData('books.json');
  const newId = String(Math.max(0, ...books.map(b => parseInt(b.id))) + 1);
  const newBook = { ...book, id: newId, sold: 0, createdAt: new Date().toISOString() };
  books.push(newBook);
  writeData('books.json', books);
  return newBook;
}

export function updateBook(id, updates) {
  const books = readData('books.json');
  const index = books.findIndex(b => b.id === id);
  if (index === -1) return null;
  books[index] = { ...books[index], ...updates };
  writeData('books.json', books);
  return books[index];
}

export function deleteBook(id) {
  let books = readData('books.json');
  const index = books.findIndex(b => b.id === id);
  if (index === -1) return false;
  books = books.filter(b => b.id !== id);
  writeData('books.json', books);
  return true;
}

// Users
export function getUsers() {
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

export function getUserById(id) {
  const users = readData('users.json');
  const user = users.find(u => u.id === id);
  if (user && user.isPremium && user.premiumExpiresAt) {
    if (new Date(user.premiumExpiresAt) < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      updateUser(id, { isPremium: false, premiumExpiresAt: null });
    }
  }
  return user || null;
}

export function getUserByPhone(phone) {
  const users = readData('users.json');
  const user = users.find(u => u.phone === phone);
  if (user && user.isPremium && user.premiumExpiresAt) {
    if (new Date(user.premiumExpiresAt) < new Date()) {
      user.isPremium = false;
      user.premiumExpiresAt = null;
      updateUser(user.id, { isPremium: false, premiumExpiresAt: null });
    }
  }
  return user || null;
}

export function createUser(user) {
  const users = readData('users.json');
  const newId = String(Math.max(0, ...users.map(u => parseInt(u.id))) + 1);
  const newUser = {
    id: newId,
    ...user,
    isPremium: false,
    savedBooks: [],
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeData('users.json', users);
  return newUser;
}

export function updateUser(id, updates) {
  const users = readData('users.json');
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  writeData('users.json', users);
  return users[index];
}

// Orders
export function getOrders() {
  return readData('orders.json');
}

export function getOrdersByUserId(userId) {
  const orders = readData('orders.json');
  return orders.filter(o => o.userId === userId);
}

export function addOrder(order) {
  const orders = readData('orders.json');
  const newId = String(Math.max(0, ...orders.map(o => parseInt(o.id))) + 1);
  const newOrder = { ...order, id: newId, createdAt: new Date().toISOString() };
  orders.push(newOrder);
  writeData('orders.json', orders);
  
  // Update book sold count
  const books = readData('books.json');
  const bookIndex = books.findIndex(b => b.id === order.bookId);
  if (bookIndex !== -1) {
    books[bookIndex].sold = (books[bookIndex].sold || 0) + 1;
    writeData('books.json', books);
  }
  
  return newOrder;
}

// Stats
export function getStats() {
  const books = readData('books.json');
  const users = readData('users.json');
  const orders = readData('orders.json');
  
  const totalBooks = books.length;
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const premiumUsers = users.filter(u => u.isPremium).length;
  const totalSold = books.reduce((sum, b) => sum + (b.sold || 0), 0);
  
  // Category stats
  const categoryStats = {};
  books.forEach(b => {
    if (!categoryStats[b.category]) categoryStats[b.category] = 0;
    categoryStats[b.category] += (b.sold || 0);
  });
  
  // Recent orders
  const recentOrders = orders.slice(-10).reverse();
  
  // Top books
  const topBooks = [...books].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);

  return {
    totalBooks,
    totalUsers,
    totalOrders,
    totalRevenue,
    premiumUsers,
    totalSold,
    categoryStats,
    recentOrders,
    topBooks
  };
}
