import { NextResponse } from 'next/server';
import { getBooks, addBook } from '@/lib/db';
import { verifyAdminToken, getTokenFromRequest } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const books = getBooks(search, category);
  
  // Don't send content field to list (it's large)
  const booksWithoutContent = books.map(({ content, contentRu, ...rest }) => rest);
  
  return NextResponse.json({ books: booksWithoutContent });
}

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const admin = verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, titleRu, author, authorRu, price, description, descriptionRu, category, image, pdfUrl, content, contentRu } = body;

  if (!title || !author || !price) {
    return NextResponse.json({ error: 'Title, author, and price are required' }, { status: 400 });
  }

  const book = addBook({
    title,
    titleRu: titleRu || '',
    author,
    authorRu: authorRu || '',
    price: Number(price),
    description: description || '',
    descriptionRu: descriptionRu || '',
    category: category || 'modern',
    image: image || '',
    pdfUrl: pdfUrl || '',
    content: content || '',
    contentRu: contentRu || ''
  });

  return NextResponse.json({ book }, { status: 201 });
}
