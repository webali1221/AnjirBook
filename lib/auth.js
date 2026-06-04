import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'anjir-book-secret-key-2025';

const dataDir = path.join(process.cwd(), 'data');
const adminFilePath = path.join(dataDir, 'admin.json');

function getAdminCredentials() {
  try {
    if (!fs.existsSync(adminFilePath)) {
      const defaultAdmin = {
        login: 'admin',
        passwordHash: bcrypt.hashSync('admin123', 10)
      };
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(adminFilePath, JSON.stringify(defaultAdmin, null, 2), 'utf8');
      return defaultAdmin;
    }
    return JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
  } catch (error) {
    return {
      login: 'admin',
      passwordHash: bcrypt.hashSync('admin123', 10)
    };
  }
}

export function updateAdminPassword(newPassword) {
  try {
    const creds = getAdminCredentials();
    creds.passwordHash = bcrypt.hashSync(newPassword, 10);
    fs.writeFileSync(adminFilePath, JSON.stringify(creds, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function verifyAdmin(login, password) {
  const creds = getAdminCredentials();
  return login === creds.login && bcrypt.compareSync(password, creds.passwordHash);
}

export function generateAdminToken() {
  const creds = getAdminCredentials();
  return jwt.sign({ role: 'admin', login: creds.login }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=');
      acc[key] = val;
      return acc;
    }, {});
    return cookies['token'] || cookies['adminToken'] || null;
  }
  
  return null;
}
