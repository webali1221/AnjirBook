-- 1. Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE,
  password TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  saved_books TEXT[] DEFAULT '{}',
  premium_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Books table
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT,
  title_ru TEXT,
  author TEXT,
  author_ru TEXT,
  price NUMERIC,
  description TEXT,
  description_ru TEXT,
  category TEXT,
  image TEXT,
  content TEXT,
  content_ru TEXT,
  pdf_url TEXT,
  pdf_file TEXT,
  sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- 3. Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  book_title TEXT,
  price NUMERIC,
  user_name TEXT,
  user_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 4. Function to increment sold count
CREATE OR REPLACE FUNCTION increment_sold(book_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE books
  SET sold = sold + 1
  WHERE id = book_id;
END;
$$ LANGUAGE plpgsql;
