import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const dataDir = path.join(process.cwd(), 'data');
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Connection
if (MONGODB_URI) {
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGODB_URI).catch(err => console.error('MongoDB connection error:', err));
  }
}

// Schemas
const UserSchema = new mongoose.Schema({
  id: String,
  name: String,
  phone: { type: String, unique: true },
  password: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  savedBooks: { type: [String], default: [] },
  premiumExpiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const BookSchema = new mongoose.Schema({
  id: String,
  title: String,
  titleRu: String,
  author: String,
  authorRu: String,
  price: Number,
  description: String,
  descriptionRu: String,
  category: String,
  image: String,
  content: String,
  contentRu: String,
  pdfUrl: String,
  pdfFile: String,
  sold: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  id: String,
  userId: String,
  bookId: String,
  bookTitle: String,
  price: Number,
  userName: String,
  userPhone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

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
  if (!MONGODB_URI) {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}

// ---------------------------------------------------------
// Books
// ---------------------------------------------------------
export async function getBooks(search = '', category = '') {
  if (MONGODB_URI) {
    let query = {};
    if (search) {
      const s = new RegExp(search, 'i');
      query.$or = [{ title: s }, { author: s }, { titleRu: s }, { authorRu: s }];
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    return await Book.find(query).lean();
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
  if (MONGODB_URI) {
    return await Book.findOne({ id }).lean();
  } else {
    const books = readData('books.json');
    return books.find(b => b.id === id) || null;
  }
}

export async function addBook(bookData) {
  if (MONGODB_URI) {
    const books = await Book.find().lean();
    const newId = String(Math.max(0, ...books.map(b => parseInt(b.id))) + 1);
    const newBook = new Book({ ...bookData, id: newId });
    await newBook.save();
    return newBook.toObject();
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
  if (MONGODB_URI) {
    return await Book.findOneAndUpdate({ id }, updates, { new: true }).lean();
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
  if (MONGODB_URI) {
    const res = await Book.deleteOne({ id });
    return res.deletedCount > 0;
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
  if (MONGODB_URI) {
    const users = await User.find().lean();
    // Auto-expiry check
    for (const user of users) {
      if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
        await User.updateOne({ id: user.id }, { isPremium: false, premiumExpiresAt: null });
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
  if (MONGODB_URI) {
    const user = await User.findOne({ id }).lean();
    if (user && user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
      await User.updateOne({ id: user.id }, { isPremium: false, premiumExpiresAt: null });
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
  if (MONGODB_URI) {
    return await User.findOne({ phone }).lean();
  } else {
    const users = readData('users.json');
    return users.find(u => u.phone === phone) || null;
  }
}

export async function createUser(userData) {
  if (MONGODB_URI) {
    const users = await User.find().lean();
    const newId = String(Math.max(0, ...users.map(u => parseInt(u.id))) + 1);
    const newUser = new User({ ...userData, id: newId });
    await newUser.save();
    return newUser.toObject();
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
  if (MONGODB_URI) {
    return await User.findOneAndUpdate({ id }, updates, { new: true }).lean();
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
  if (MONGODB_URI) {
    const res = await User.deleteOne({ id });
    return res.deletedCount > 0;
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
  if (MONGODB_URI) {
    return await Order.find().sort({ createdAt: -1 }).lean();
  } else {
    return readData('orders.json');
  }
}

export async function getOrdersByUserId(userId) {
  if (MONGODB_URI) {
    return await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  } else {
    const orders = readData('orders.json');
    return orders.filter(o => o.userId === userId);
  }
}

export async function addOrder(orderData) {
  if (MONGODB_URI) {
    const orders = await Order.find().lean();
    const newId = String(Math.max(0, ...orders.map(o => parseInt(o.id))) + 1);
    const newOrder = new Order({ ...orderData, id: newId });
    await newOrder.save();
    
    // Update book sold count
    await Book.updateOne({ id: orderData.bookId }, { $inc: { sold: 1 } });
    
    return newOrder.toObject();
  } else {
    const orders = readData('orders.json');
    const newId = String(Math.max(0, ...orders.map(o => parseInt(o.id))) + 1);
    const newOrder = { ...orderData, id: newId, createdAt: new Date().toISOString() };
    orders.push(newOrder);
    writeData('orders.json', orders);
    
    // Update book sold count
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
  
  if (MONGODB_URI) {
    books = await Book.find().lean();
    users = await User.find().lean();
    orders = await Order.find().lean();
  } else {
    books = readData('books.json');
    users = readData('users.json');
    orders = readData('orders.json');
  }
  
  const totalBooks = books.length;
  const totalUsers = users.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const premiumUsersCount = users.filter(u => u.isPremium).length;
  const totalSold = books.reduce((sum, b) => sum + (b.sold || 0), 0);
  
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
