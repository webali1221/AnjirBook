import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: 'Anjir Book — Kitob sotish sayti',
  description: "O'zbekistonning eng yaxshi onlayn kitob do'koni. Kitoblarni qidiring, o'qing va saqlang.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
